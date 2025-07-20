import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { SQSEvent } from "aws-lambda"

const client = new S3Client({})

export const handler = async (event: SQSEvent) => {
  console.log("Hello, world!")
  for (const record of event.Records) {
    client.send(
      new PutObjectCommand({
        Bucket: "automated-bucket",
        Key: record.messageId,
        Body: record.body,
      })
    )
  }
}
