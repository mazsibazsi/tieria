# tieria

Tieria is a Gemini server written in TypeScript using Node.js. It's defining feature is the ability to evaluate JavaScript code inside the files before serving.

# How to run?

Configure your tieria.json file. The key-value pairs should be self-explanatory.
Place your certificate (cert.crt) and key (key.crt) inside the certs/ folder.
Compile the TS code into JS.
Run!

# How to use the JavaScript evaluation feature?

Use the file extension .rde and place your code between <GN and 00> tags.
