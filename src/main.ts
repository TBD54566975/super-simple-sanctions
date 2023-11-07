import { DevTools } from '@tbdex/http-client'
import { createOrLoadDid } from './utils.js'


import fetch from 'node-fetch'

type SanctionListEntry = {
  [key: string]: any;
  remarks?: string;
}

type SearchParams = {
  countryName: string;
  birthDate: Date;
  monthRange: number;
}

const processData = (data, params: SearchParams) => {
  const { countryName, birthDate, monthRange } = params
  const countryRegex = new RegExp('country|countries|address', 'i')
  const birthRegex = new RegExp('dateofbirth|birth', 'i')
  const dobRegex = /DOB\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i

  const fuzzyMatchCountry = (value: string) => value.toLowerCase().includes(countryName.toLowerCase())
  const matchDate = (dateString: string) => {
    const date = new Date(dateString)
    const lowerBound = new Date(birthDate)
    const upperBound = new Date(birthDate)
    lowerBound.setMonth(lowerBound.getMonth() - monthRange)
    upperBound.setMonth(upperBound.getMonth() + monthRange)
    return date >= lowerBound && date <= upperBound
  }

  const filteredResults = Object.entries(data).reduce((acc, [listName, listItems]) => {
    // Check if listItems is an array
    if (!Array.isArray(listItems)) {
      // If not, safely handle the case (e.g., by assigning an empty array or logging a warning)
      acc[listName] = []
      return acc
    }

    acc[listName] = listItems.filter((entry: SanctionListEntry) => {
      let countryMatchFound = false
      let birthMatchFound = false

      for (const [key, value] of Object.entries(entry)) {
        if (countryRegex.test(key) && Array.isArray(value)) {
          countryMatchFound = value.some(fuzzyMatchCountry)
        }
        if (birthRegex.test(key) && typeof value === 'string') {
          birthMatchFound = matchDate(value)
        }
        if (key === 'remarks' && typeof value === 'string') {
          const dobMatch = value.match(dobRegex)
          if (dobMatch) birthMatchFound = matchDate(dobMatch[1])
        }
      }

      return countryMatchFound || birthMatchFound
    })

    return acc
  }, {} as { [key: string]: any[] })

  return filteredResults
}





// Fetch data from the given URL and then filter based on DOB
async function sanctionsCheck(name, country, birthDate, monthRange) {
  // ensure docker run -p 8084:8084 -p 9094:9094 moov/watchman:latest is running
  const watchmanHost = process.env.WATCHMAN_HOST || 'localhost'
  const response = await fetch(`http://${watchmanHost}:8084/search?q=${name}&minMatch=0.95`)

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  const data = await response.json()
  const filteredData = processData(data, {
    countryName: country,
    birthDate: new Date(birthDate), // Replace with the actual birth date
    monthRange: monthRange
  })

  return filteredData
}


function areAllListsEmpty(data): boolean {
  return Object.values(data).every((value) => Array.isArray(value) && value.length === 0)
}







const issuer = await createOrLoadDid('issuer.json')


import express from 'express'

const app = express()
const port = 3000 // Use any port suitable for your environment

// Endpoint to check sanctions and return a credential
app.get('/check-sanctions', async (req, res) => {
  const { name, dateOfBirth, country, monthRange, customerDid } = req.query

  // Validate query parameters
  if (!name || !dateOfBirth || !country || !monthRange) {
    return res.status(400).send({ error: 'Missing query parameters' })
  }

  try {
    const results = await sanctionsCheck(name as string, country as string, dateOfBirth as string, monthRange)
    const isEmpty = areAllListsEmpty(results)

    if (isEmpty) {
      // Here you would call a function to create the credential, which is not fully shown in your original code
      const { signedCredential } = await DevTools.createCredential({
        type    : 'SanctionCredential',
        issuer  : issuer,
        subject: customerDid as unknown as string,
        data    : {
          'beep': 'boop'
        }
      })

      // Respond with the credential if all lists are empty
      res.json({ signedCredential })
    } else {
      // Respond with the results if not all lists are empty
      res.json({ results })
    }
  } catch (error) {
    res.status(500).send({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})


