import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const awsCredetnials = {
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCOUNT_ACCESS_KEY,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_ACCOUNT_SECRET_KEY,
};

const dynamoConfig = {
  region: process.env.NEXT_PUBLIC_AWS_ACCOUNT_REGION,
  credentials: awsCredetnials,
} as {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  region: string;
};

const db = DynamoDBDocument.from(new DynamoDB(dynamoConfig), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
});

const isProd = process.env.NEXT_PUBLIC_NODE_ENV === 'production';
const appUrl = !isProd
  ? 'http://localhost:3000'
  : 'https://sudo.party';

export { dynamoConfig, db, appUrl, isProd };
