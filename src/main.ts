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
  const response = await fetch(`http://localhost:8084/search?q=${name}&minMatch=0.95`)

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




// Usage
let res2 = await sanctionsCheck('IBRAHIM,%20Haji', 'Iraq', '28 Sep 1957', 12)
console.log(res2)



function areAllListsEmpty(data): boolean {
  return Object.values(data).every((value) => Array.isArray(value) && value.length === 0)
}


console.log(areAllListsEmpty(res2))


res2 = await sanctionsCheck('Michael Neale', 'Australia', '28 Sep 1974', 12)
console.log(areAllListsEmpty(res2))


process.exit(0)



// get the did from the command line parameter
const customerDid = process.argv[2]

const issuer = await createOrLoadDid('issuer.json')

//
// At this point we can check if the user is sanctioned or not and decide to issue the credential.
// TOOD: implement the actual sanctions check!


//
//
// Create a sanctions credential so that the PFI knows that Alice is legit.
//
const { signedCredential } = await DevTools.createCredential({
  type    : 'SanctionCredential',
  issuer  : issuer,
  subject : customerDid,
  data    : {
    'beep': 'boop'
  }
})

console.log('Copy this signed credential for later use:\n\n', signedCredential)



