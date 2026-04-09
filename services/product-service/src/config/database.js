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

const PRODUCT_TABLE = process.env.PRODUCT_TABLE || 'products';
const CATEGORY_TABLE = process.env.CATEGORY_TABLE || 'categories';

/* =========================
   INIT DB (RESTORED ✅)
========================= */
const initializeDynamoDB = async () => {
  try {
    const tables = await dynamodb.listTables().promise();

    // PRODUCT TABLE
    if (!tables.TableNames.includes(PRODUCT_TABLE)) {
      console.log(`Creating table: ${PRODUCT_TABLE}`);

      await dynamodb.createTable({
        TableName: PRODUCT_TABLE,
        KeySchema: [{ AttributeName: 'productId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'productId', AttributeType: 'S' },
          { AttributeName: 'categoryId', AttributeType: 'S' },
          { AttributeName: 'sku', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'CategoryIndex',
            KeySchema: [{ AttributeName: 'categoryId', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'SkuIndex',
            KeySchema: [{ AttributeName: 'sku', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }).promise();

      await dynamodb.waitFor('tableExists', { TableName: PRODUCT_TABLE }).promise();
    }

    // CATEGORY TABLE
    if (!tables.TableNames.includes(CATEGORY_TABLE)) {
      console.log(`Creating table: ${CATEGORY_TABLE}`);

      await dynamodb.createTable({
        TableName: CATEGORY_TABLE,
        KeySchema: [{ AttributeName: 'categoryId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'categoryId', AttributeType: 'S' },
          { AttributeName: 'name', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'NameIndex',
            KeySchema: [{ AttributeName: 'name', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }).promise();

      await dynamodb.waitFor('tableExists', { TableName: CATEGORY_TABLE }).promise();
    }

    await createDefaultCategories();

  } catch (error) {
    console.error('Error initializing DynamoDB:', error);
    throw error;
  }
};

/* =========================
   DEFAULT DATA
========================= */
const createDefaultCategories = async () => {
  const defaults = [
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Books', description: 'Books and educational materials' },
    { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
    { name: 'Sports', description: 'Sports equipment and accessories' },
  ];

  for (const c of defaults) {
    try {
      const existing = await categoryOperations.getCategoryByName(c.name);
      if (!existing) {
        await categoryOperations.createCategory({
          categoryId: Date.now().toString(),
          ...c,
        });
      }
    } catch (err) {
      console.error('Seed error:', err);
    }
  }
};

/* =========================
   PRODUCT OPS (UNCHANGED)
========================= */
const productOperations = {
  async createProduct(data) {
    await docClient.put({
      TableName: PRODUCT_TABLE,
      Item: {
        ...data,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }).promise();
  },

  async getProductById(productId) {
    const res = await docClient.get({
      TableName: PRODUCT_TABLE,
      Key: { productId },
    }).promise();
    return res.Item;
  },

  async updateProduct(productId, data) {
    return docClient.update({
      TableName: PRODUCT_TABLE,
      Key: { productId },
      UpdateExpression: 'SET #data = :data, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#data': 'data',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':data': data,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }).promise();
  },

  async deleteProduct(productId) {
    return docClient.update({
      TableName: PRODUCT_TABLE,
      Key: { productId },
      UpdateExpression: 'SET #isActive = :false',
      ExpressionAttributeNames: {
        '#isActive': 'isActive',
      },
      ExpressionAttributeValues: {
        ':false': false,
      },
    }).promise();
  },
};

/* =========================
   CATEGORY OPS (FIXED ✅)
========================= */
const categoryOperations = {
  async createCategory(data) {
    await docClient.put({
      TableName: CATEGORY_TABLE,
      Item: {
        ...data,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }).promise();
  },

  async getCategoryById(categoryId) {
    const res = await docClient.get({
      TableName: CATEGORY_TABLE,
      Key: { categoryId },
    }).promise();
    return res.Item;
  },

  async getCategoryByName(name) {
    const res = await docClient.query({
      TableName: CATEGORY_TABLE,
      IndexName: 'NameIndex',
      KeyConditionExpression: 'name = :name',
      ExpressionAttributeValues: { ':name': name },
    }).promise();
    return res.Items[0];
  },

  async listCategories() {
    const res = await docClient.scan({
      TableName: CATEGORY_TABLE,
      FilterExpression: '#isActive = :true',
      ExpressionAttributeNames: { '#isActive': 'isActive' },
      ExpressionAttributeValues: { ':true': true },
    }).promise();
    return res.Items;
  },

  // ✅ FIXED UPDATE
  async updateCategory(categoryId, data) {
    return docClient.update({
      TableName: CATEGORY_TABLE,
      Key: { categoryId },
      UpdateExpression: 'SET #name = :name, #desc = :desc, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#desc': 'description',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':name': data.name,
        ':desc': data.description,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }).promise();
  },

  // ✅ FIXED DELETE
  async deleteCategory(categoryId) {
    return docClient.update({
      TableName: CATEGORY_TABLE,
      Key: { categoryId },
      UpdateExpression: 'SET #isActive = :false, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#isActive': 'isActive',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':false': false,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }).promise();
  },
};

module.exports = {
  initializeDynamoDB,
  productOperations,
  categoryOperations,
  docClient,
};