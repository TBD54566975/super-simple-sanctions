# Super simple sanctions credential issuer

This sanctions checker does fuzzy date and country and name checking and issues a Verifiable Credential if the name is not on any sanctions list.

Uses: https://moov-io.github.io/watchman/ as sanctions search engine.

# Running

Ensure you have docker installed. 

1) Run watchman: 
`docker run -p 8084:8084 -p 9094:9094 moov/watchman:latest`

which will take a few minutes to sync the sanctions lists. 

2) Run the issuer:

`npm run server`

Try it out: 

* This will issue you a credential: http://localhost:3000/check-sanctions?name=Mic&dateOfBirth=10-july-1974&country=Australia&monthRange=12&customerDid=123 (replace with the DID you want)

This will fail: 

http://localhost:3000/check-sanctions?name=IBRAHIM,%20Haji&dateOfBirth=28%20Sep%201957&country=Iraq&monthRange=12

As the individual is sanctioned (and you can see why). 

TODO: Moar docs. 