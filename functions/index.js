const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pdf = require('html-pdf');
const UUID = require("uuid-v4");

const gcs = require('@google-cloud/storage')();
const path = require('path');
const os = require('os');
const fs = require('fs');
admin.initializeApp(functions.config().firebase);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//



function upload(localFile, remoteFile) {

  let uuid = UUID();
  const bucket = admin.storage().bucket();

  return bucket.upload(localFile, {
    destination: remoteFile,
    uploadType: "media",
    metadata: {
      contentType: 'application/pdf',
      metadata: {
        firebaseStorageDownloadTokens: uuid
      }
    }
  })
    .then((data) => {

      let file = data[0];

      return Promise.resolve("https://firebasestorage.googleapis.com/v0/b/" + bucket.name + "/o/" + encodeURIComponent(file.name) + "?alt=media&token=" + uuid);
    });
}
exports.generatePdf = functions.https.onRequest((request, response) => {
  const options = {
    "format": 'A4',
    "orientation": "portrait"
  };

  const localPDFFile = path.join(os.tmpdir(), 'localPDFFile.pdf');
  Promise.resolve().then(() => {
    const html = "<html><body>OK, generating pdf</body></html>";
    console.log("template compiled with user data", html);

    pdf.create(html, options).toFile(localPDFFile, function (err, res) {
      if (err) {
        console.log(err);
        return response.send("PDF creation error");
      }

      let uuid = UUID();
      console.log("pdf created locally");
      return upload(localPDFFile, "quote.pdf").then((url) => {
        response.send({ message: "PDF created and uploaded! ", url });
      }).catch((err) => {
        response.send('Failed to upload: ' + JSON.stringify(err));

      });

    });
  });
});
