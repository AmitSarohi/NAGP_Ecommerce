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

// Initialize DynamoDB tables
const initializeDynamoDB = async () => {
  try {
    const tables = await dynamodb.listTables().promise();
    
    // Create Product table
    if (!tables.TableNames.includes(PRODUCT_TABLE)) {
      console.log(`Creating table: ${PRODUCT_TABLE}`);
      
      const productParams = {
        TableName: PRODUCT_TABLE,
        KeySchema: [
          { AttributeName: 'productId', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'productId', AttributeType: 'S' },
          { AttributeName: 'categoryId', AttributeType: 'S' },
          { AttributeName: 'sku', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'CategoryIndex',
            KeySchema: [
              { AttributeName: 'categoryId', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            }
          },
          {
            IndexName: 'SkuIndex',
            KeySchema: [
              { AttributeName: 'sku', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            }
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };

      await dynamodb.createTable(productParams).promise();
      console.log(`Table ${PRODUCT_TABLE} created successfully`);
      await dynamodb.waitFor('tableExists', { TableName: PRODUCT_TABLE }).promise();
    } else {
      console.log(`Table ${PRODUCT_TABLE} already exists`);
    }

    // Create Category table
    if (!tables.TableNames.includes(CATEGORY_TABLE)) {
      console.log(`Creating table: ${CATEGORY_TABLE}`);
      
      const categoryParams = {
        TableName: CATEGORY_TABLE,
        KeySchema: [
          { AttributeName: 'categoryId', KeyType: 'HASH' },
        ],
        AttributeDefinitions: [
          { AttributeName: 'categoryId', AttributeType: 'S' },
          { AttributeName: 'name', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'NameIndex',
            KeySchema: [
              { AttributeName: 'name', KeyType: 'HASH' },
            ],
            Projection: {
              ProjectionType: 'ALL',
            }
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      };

      await dynamodb.createTable(categoryParams).promise();
      console.log(`Table ${CATEGORY_TABLE} created successfully`);
      await dynamodb.waitFor('tableExists', { TableName: CATEGORY_TABLE }).promise();
    } else {
      console.log(`Table ${CATEGORY_TABLE} already exists`);
    }

    // Create default categories if they don't exist
    await createDefaultCategories();
    
  } catch (error) {
    console.error('Error initializing DynamoDB:', error);
    throw error;
  }
};

// Create default categories
const createDefaultCategories = async () => {
  const defaultCategories = [
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Books', description: 'Books and educational materials' },
    { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
    { name: 'Sports', description: 'Sports equipment and accessories' },
  ];

  for (const category of defaultCategories) {
    try {
      const existing = await categoryOperations.getCategoryByName(category.name);
      if (!existing) {
        await categoryOperations.createCategory(category);
        console.log(`Created default category: ${category.name}`);
      }
    } catch (error) {
      console.error(`Error creating category ${category.name}:`, error);
    }
  }
};

// Product CRUD operations
const productOperations = {
  // Create product
  async createProduct(productData) {
    const params = {
      TableName: PRODUCT_TABLE,
      Item: {
        productId: productData.productId,
        sku: productData.sku,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        categoryId: productData.categoryId,
        inventoryCount: productData.inventoryCount || 0,
        images: productData.images || [],
        attributes: productData.attributes || {},
        isActive: productData.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ConditionExpression: 'attribute_not_exists(productId)',
    };

    try {
      await docClient.put(params).promise();
      return { success: true, productId: productData.productId };
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Product with this ID already exists');
      }
      throw error;
    }
  },

  // Get product by ID
  async getProductById(productId) {
    const params = {
      TableName: PRODUCT_TABLE,
      Key: { productId },
    };

    try {
      const result = await docClient.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw error;
    }
  },

  // Get product by SKU
  async getProductBySku(sku) {
    const params = {
      TableName: PRODUCT_TABLE,
      IndexName: 'SkuIndex',
      KeyConditionExpression: 'sku = :sku',
      ExpressionAttributeValues: {
        ':sku': sku,
      },
    };

    try {
      const result = await docClient.query(params).promise();
      return result.Items[0] || null;
    } catch (error) {
      console.error('Error getting product by SKU:', error);
      throw error;
    }
  },

  // Update product
  async updateProduct(productId, updateData) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach((key, index) => {
      if (key !== 'productId' && key !== 'createdAt') {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updateData[key];
      }
    });

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      TableName: PRODUCT_TABLE,
      Key: { productId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    try {
      const result = await docClient.update(params).promise();
      return result.Attributes;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product (soft delete)
  async deleteProduct(productId) {
    const params = {
      TableName: PRODUCT_TABLE,
      Key: { productId },
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
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // List products by category
  async getProductsByCategory(categoryId, limit = 50, lastEvaluatedKey = null) {
    const params = {
      TableName: PRODUCT_TABLE,
      IndexName: 'CategoryIndex',
      KeyConditionExpression: 'categoryId = :categoryId',
      FilterExpression: '#isActive = :isActive',
      ExpressionAttributeValues: {
        ':categoryId': categoryId,
        ':isActive': true,
      },
      ExpressionAttributeNames: {
        '#isActive': 'isActive',
      },
      Limit: limit,
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    try {
      const result = await docClient.query(params).promise();
      return {
        products: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }
  },

  // Search products
  async searchProducts(searchTerm, limit = 50, lastEvaluatedKey = null) {
    const params = {
      TableName: PRODUCT_TABLE,
      FilterExpression: 'contains(#name, :searchTerm) OR contains(description, :searchTerm) AND #isActive = :isActive',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#isActive': 'isActive',
      },
      ExpressionAttributeValues: {
        ':searchTerm': searchTerm,
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
        products: result.Items,
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },
};

// Category CRUD operations
const categoryOperations = {
  // Create category
  async createCategory(categoryData) {
    const params = {
      TableName: CATEGORY_TABLE,
      Item: {
        categoryId: categoryData.categoryId,
        name: categoryData.name,
        description: categoryData.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      },
      ConditionExpression: 'attribute_not_exists(categoryId)',
    };

    try {
      await docClient.put(params).promise();
      return { success: true, categoryId: categoryData.categoryId };
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Category already exists');
      }
      throw error;
    }
  },

  // Get category by ID
  async getCategoryById(categoryId) {
    const params = {
      TableName: CATEGORY_TABLE,
      Key: { categoryId },
    };

    try {
      const result = await docClient.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error getting category by ID:', error);
      throw error;
    }
  },

  // Get category by name
  async getCategoryByName(name) {
    const params = {
      TableName: CATEGORY_TABLE,
      IndexName: 'NameIndex',
      KeyConditionExpression: 'name = :name',
      ExpressionAttributeValues: {
        ':name': name,
      },
    };

    try {
      const result = await docClient.query(params).promise();
      return result.Items[0] || null;
    } catch (error) {
      console.error('Error getting category by name:', error);
      throw error;
    }
  },

  // List all categories
  async listCategories() {
    const params = {
      TableName: CATEGORY_TABLE,
      FilterExpression: '#isActive = :isActive',
      ExpressionAttributeNames: {
        '#isActive': 'isActive',
      },
      ExpressionAttributeValues: {
        ':isActive': true,
      },
    };

    try {
      const result = await docClient.scan(params).promise();
      return result.Items;
    } catch (error) {
      console.error('Error listing categories:', error);
      throw error;
    }
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
