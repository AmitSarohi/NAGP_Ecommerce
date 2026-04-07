const AWS = require('aws-sdk');

/* =========================
   AWS CONFIG
========================= */
AWS.config.update({
  region: process.env.DYNAMODB_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

const USER_TABLE = process.env.USER_TABLE || 'users';

/* =========================
   INIT TABLE
========================= */
const initializeDynamoDB = async () => {
  try {
    const tables = await dynamodb.listTables().promise();

    if (!tables.TableNames.includes(USER_TABLE)) {
      console.log(`Creating table: ${USER_TABLE}`);

      const params = {
        TableName: USER_TABLE,
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'email', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'EmailIndex',
            KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };

      await dynamodb.createTable(params).promise();
      await dynamodb.waitFor('tableExists', { TableName: USER_TABLE }).promise();

      console.log(`✅ Table ${USER_TABLE} created`);
    } else {
      console.log(`✅ Table ${USER_TABLE} exists`);
    }
  } catch (error) {
    console.error('DynamoDB init error:', error);
    throw error;
  }
};

/* =========================
   USER OPERATIONS
========================= */
const userOperations = {
  /* CREATE */
  async createUser(userData) {
    const params = {
      TableName: USER_TABLE,
      Item: {
        userId: userData.userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: userData.passwordHash || null,
        googleId: userData.googleId || null,
        isOAuthUser: userData.isOAuthUser || false,
        role: userData.role || 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: userData.isActive ?? true,
      },
      ConditionExpression: 'attribute_not_exists(userId)',
    };

    await docClient.put(params).promise();
    return { success: true };
  },

  /* GET BY ID */
  async getUserById(userId) {
    const res = await docClient
      .get({
        TableName: USER_TABLE,
        Key: { userId },
      })
      .promise();

    return res.Item || null;
  },

  /* GET BY EMAIL */
  async getUserByEmail(email) {
    const res = await docClient
      .query({
        TableName: USER_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      })
      .promise();

    return res.Items?.[0] || null;
  },

  /* 🔥 FLEXIBLE UPDATE */
  async updateUser(userId, updateData) {
    const keys = Object.keys(updateData);

    if (!keys.length) return null;

    let UpdateExpression = 'SET #updatedAt = :updatedAt';
    let ExpressionAttributeNames = { '#updatedAt': 'updatedAt' };
    let ExpressionAttributeValues = {
      ':updatedAt': new Date().toISOString(),
    };

    keys.forEach((key) => {
      UpdateExpression += `, #${key} = :${key}`;
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = updateData[key];
    });

    const res = await docClient
      .update({
        TableName: USER_TABLE,
        Key: { userId },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
      .promise();

    return res.Attributes;
  },

  /* SOFT DELETE */
  async deleteUser(userId) {
    return this.updateUser(userId, {
      isActive: false,
    });
  },

  /* LIST USERS */
  async listUsers(limit = 50, lastEvaluatedKey = null) {
    const params = {
      TableName: USER_TABLE,
      FilterExpression: '#isActive = :isActive',
      ExpressionAttributeNames: {
        '#isActive': 'isActive',
      },
      ExpressionAttributeValues: {
        ':isActive': true,
      },
      Limit: limit,
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const res = await docClient.scan(params).promise();

    return {
      users: res.Items || [],
      lastEvaluatedKey: res.LastEvaluatedKey || null,
    };
  },
};

/* =========================
   EXPORTS
========================= */
module.exports = {
  initializeDynamoDB,
  userOperations,
  docClient,
  USER_TABLE,
};