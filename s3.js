const aws = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const region = "ap-southeast-1";
const bucketName = "swap-it";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: "v4",
});

const s3GenerateUploadURL = async () => {
  const imageName = uuidv4();

  const params = {
    Bucket: bucketName,
    Key: imageName,
    Expires: 60,
  };

  const uploadURL = await s3.getSignedUrlPromise("putObject", params);
  return uploadURL;
};

module.exports = s3GenerateUploadURL;
