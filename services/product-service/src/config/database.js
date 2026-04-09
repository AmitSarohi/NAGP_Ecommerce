const AWS = require('aws-sdk');

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

const initializeDynamoDB = async () => {
try {
const tables = await dynamodb.listTables().promise();

if (!tables.TableNames.includes(PRODUCT_TABLE)) {
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

if (!tables.TableNames.includes(CATEGORY_TABLE)) {
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

} catch (error) {
console.error('DynamoDB init error:', error.message);
}
};

const productOperations = {
async createProduct(data) {
return docClient.put({
TableName: PRODUCT_TABLE,
Item: data,
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
return docClient.put({
TableName: PRODUCT_TABLE,
Item: { ...data, productId },
}).promise();
},

async deleteProduct(productId) {
return docClient.update({
TableName: PRODUCT_TABLE,
Key: { productId },
UpdateExpression: 'SET #isActive = :false',
ExpressionAttributeNames: { '#isActive': 'isActive' },
ExpressionAttributeValues: { ':false': false },
}).promise();
},

async listProducts() {
const res = await docClient.scan({
TableName: PRODUCT_TABLE,
}).promise();
return res.Items;
},
};

const categoryOperations = {
async createCategory(data) {
return docClient.put({
TableName: CATEGORY_TABLE,
Item: {
...data,
categoryId: data.categoryId || Date.now().toString(),
isActive: true,
createdAt: new Date().toISOString(),
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
KeyConditionExpression: '#name = :name',
ExpressionAttributeNames: { '#name': 'name' },
ExpressionAttributeValues: { ':name': name },
}).promise();
return res.Items[0];
},

async listCategories() {
const res = await docClient.scan({
TableName: CATEGORY_TABLE,
}).promise();
return res.Items;
},

async updateCategory(categoryId, data) {
return docClient.put({
TableName: CATEGORY_TABLE,
Item: {
...data,
categoryId,
updatedAt: new Date().toISOString(),
},
}).promise();
},

async deleteCategory(categoryId) {
return docClient.update({
TableName: CATEGORY_TABLE,
Key: { categoryId },
UpdateExpression: 'SET #isActive = :false',
ExpressionAttributeNames: { '#isActive': 'isActive' },
ExpressionAttributeValues: { ':false': false },
}).promise();
},
};

module.exports = {
initializeDynamoDB,
productOperations,
categoryOperations,
docClient,
PRODUCT_TABLE,
CATEGORY_TABLE,
};