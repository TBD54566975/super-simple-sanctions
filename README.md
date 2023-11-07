# Super simple sanctions credential issuer

This sanctions checker does fuzzy date and country and name checking and issues a Verifiable Credential if the name is not on any sanctions list.

Uses: https://moov-io.github.io/watchman/ as sanctions search engine as well as web5-js library.

# Running

Ensure you have docker and docker-compose installed:
        
    docker-compose up --build
    

This will take a minute to sync and index the data from the sanctions lists (such as OFAC and more) as well as refresh them periodically. 

Try it out: 

* This will issue you a credential: http://localhost:3000/check-sanctions?name=Mic&dateOfBirth=10-july-1974&country=Australia&monthRange=12&customerDid=123 (replace with the DID you want)

This will fail as the individual is sanctioned: 

http://localhost:3000/check-sanctions?name=IBRAHIM,%20Haji&dateOfBirth=28%20Sep%201957&country=Iraq&monthRange=12


That is all!
