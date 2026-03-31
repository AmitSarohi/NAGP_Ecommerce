const AWS = require('aws-sdk');

// Configure AWS SDK
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

// Initialize DynamoDB table
const initializeDynamoDB = async () => {
  try {
    // Check if table exists
    const tables = await dynamodb.listTables().promise();
    
    if (!tables.TableNames.includes(USER_TABLE)) {
      console.log(`Creating table: ${USER_TABLE}`);
      
      const params = {
        TableName: USER_TABLE,
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'email', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'EmailIndex',
            KeySchema: [
              { AttributeName: 'email', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            }
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };

      await dynamodb.createTable(params).promise();
      console.log(`Table ${USER_TABLE} created successfully`);
      
      // Wait for table to become active
      await dynamodb.waitFor('tableExists', { TableName: USER_TABLE }).promise();
    } else {
      console.log(`Table ${USER_TABLE} already exists`);
    }
  } catch (error) {
    console.error('Error initializing DynamoDB:', error);
    throw error;
  }
};

// User CRUD operations
const userOperations = {
  // Create user
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
        role: userData.role || 'user',  // 'user' or 'admin'
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: userData.isActive !== undefined ? userData.isActive : true,
      },
      ConditionExpression: 'attribute_not_exists(userId)',
    };

    try {
      await docClient.put(params).promise();
      return { success: true, userId: userData.userId };
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('User already exists');
      }
      throw error;
    }
  },

  // Get user by ID
  async getUserById(userId) {
    const params = {
      TableName: USER_TABLE,
      Key: { userId },
    };

    try {
      const result = await docClient.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email) {
    const params = {
      TableName: USER_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    };

    try {
      const result = await docClient.query(params).promise();
      return result.Items[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  // Update user
  async updateUser(userId, updateData) {
    const params = {
      TableName: USER_TABLE,
      Key: { userId },
      UpdateExpression: 'SET #firstName = :firstName, #lastName = :lastName, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#firstName': 'firstName',
        '#lastName': 'lastName',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':firstName': updateData.firstName,
        ':lastName': updateData.lastName,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    };

    try {
      const result = await docClient.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user (soft delete)
  async deleteUser(userId) {
    const params = {
      TableName: USER_TABLE,
      Key: { userId },
      UpdateExpression: 'SET #isActive = :isActive, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#isActive': 'isActive',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':isActive': false,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    };

    try {
      const result = await docClient.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // List users (with pagination)
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

    try {
      const result = await docClient.scan(params).promise();
      return {
        users: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  },
};

module.exports = {
  initializeDynamoDB,
  userOperations,
  docClient,
  USER_TABLE,
};
