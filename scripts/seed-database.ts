// scripts/seed-database.ts
import { supabase } from '../src/lib/supabase';

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Insert categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .insert([
        {
          name: 'Root Crops',
          description: 'Yams, cassava, sweet potatoes and other tubers',
          slug: 'root-crops',
          image_url: 'https://source.unsplash.com/random/800x600/?yams'
        },
        {
          name: 'Fruits',
          description: 'Fresh tropical and seasonal fruits',
          slug: 'fruits',
          image_url: 'https://source.unsplash.com/random/800x600/?tropical-fruits'
        },
        {
          name: 'Vegetables',
          description: 'Locally grown vegetables and leafy greens',
          slug: 'vegetables',
          image_url: 'https://source.unsplash.com/random/800x600/?vegetables'
        },
        {
          name: 'Grains & Cereals',
          description: 'Rice, maize, millet and other grains',
          slug: 'grains-cereals',
          image_url: 'https://source.unsplash.com/random/800x600/?grains'
        },
        {
          name: 'Cash Crops',
          description: 'Cocoa, coffee, and other export crops',
          slug: 'cash-crops',
          image_url: 'https://source.unsplash.com/random/800x600/?cocoa'
        },
        {
          name: 'Farm Supplies',
          description: 'Tools, seeds, and farming equipment',
          slug: 'farm-supplies',
          image_url: 'https://source.unsplash.com/random/800x600/?farm-tools'
        }
      ])
      .select();

    if (categoriesError) {
      throw categoriesError;
    }

    console.log(`Inserted ${categories?.length || 0} categories`);

    // Map category names to IDs for reference
    const categoryMap = new Map();
    categories?.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Insert products
    const products = [
      {
        name: 'Premium Wireless Earbuds',
        price: 99.99,
        description: 'High-quality sound with noise cancellation. These premium earbuds offer crystal clear audio and comfort for all-day wear.',
        image_url: 'https://source.unsplash.com/random/800x600/?earbuds',
        category_id: categoryMap.get('Electronics'),
        inventory_count: 15,
        featured: true,
        rating: 4.5,
        discount_percentage: 15,
        sales_count: 42,
        sku: 'EARS-001',
        tags: ['wireless', 'audio', 'bluetooth']
      },
      {
        name: 'Smart Watch',
        price: 199.99,
        description: 'Track your fitness and stay connected with this feature-packed smart watch. Monitor heart rate, sleep, and much more.',
        image_url: 'https://source.unsplash.com/random/800x600/?smartwatch',
        category_id: categoryMap.get('Electronics'),
        inventory_count: 8,
        featured: true,
        rating: 4.8,
        sales_count: 36,
        sku: 'WTCH-002',
        tags: ['wearable', 'fitness', 'smart']
      },
      {
        name: 'Leather Backpack',
        price: 79.99,
        description: 'Stylish and durable for everyday use. This genuine leather backpack has multiple compartments and padded laptop sleeve.',
        image_url: 'https://source.unsplash.com/random/800x600/?backpack',
        category_id: categoryMap.get('Fashion'),
        inventory_count: 20,
        featured: true,
        rating: 4.3,
        discount_percentage: null,
        sales_count: 28,
        sku: 'BAG-003',
        tags: ['leather', 'bag', 'accessory']
      },
      {
        name: 'Scented Candle Set',
        price: 34.99,
        description: 'Create a cozy atmosphere with premium scents. Set of three hand-poured candles with natural soy wax.',
        image_url: 'https://source.unsplash.com/random/800x600/?candle',
        category_id: categoryMap.get('Home'),
        inventory_count: 12,
        featured: true,
        rating: 4.6,
        discount_percentage: null,
        sales_count: 53,
        sku: 'CNDL-004',
        tags: ['home', 'decor', 'scented']
      },
      {
        name: 'Bluetooth Speaker',
        price: 59.99,
        description: 'Powerful sound in a compact design. Waterproof speaker with 12-hour battery life and deep bass response.',
        image_url: 'https://source.unsplash.com/random/800x600/?speaker',
        category_id: categoryMap.get('Electronics'),
        inventory_count: 25,
        featured: false,
        rating: 4.2,
        discount_percentage: 10,
        sales_count: 31,
        sku: 'SPKR-005',
        tags: ['audio', 'wireless', 'portable']
      },
      {
        name: 'Yoga Mat',
        price: 29.99,
        description: 'Eco-friendly material with excellent grip. Non-slip surface and perfect thickness for joint protection.',
        image_url: 'https://source.unsplash.com/random/800x600/?yoga',
        category_id: categoryMap.get('Sports'),
        inventory_count: 30,
        featured: false,
        rating: 4.7,
        discount_percentage: null,
        sales_count: 47,
        sku: 'YOGA-006',
        tags: ['fitness', 'exercise', 'yoga']
      },
      {
        name: 'Coffee Maker',
        price: 89.99,
        description: 'Brew perfect coffee every morning. Programmable 12-cup coffee maker with auto shut-off and pause-and-serve feature.',
        image_url: 'https://source.unsplash.com/random/800x600/?coffee',
        category_id: categoryMap.get('Home'),
        inventory_count: 18,
        featured: false,
        rating: 4.4,
        discount_percentage: null,
        sales_count: 24,
        sku: 'COFF-007',
        tags: ['kitchen', 'appliance', 'coffee']
      },
      {
        name: 'Desk Lamp',
        price: 39.99,
        description: 'Adjustable LED lamp with wireless charging. Modern design with touch controls and multiple brightness levels.',
        image_url: 'https://source.unsplash.com/random/800x600/?lamp',
        category_id: categoryMap.get('Home'),
        inventory_count: 22,
        featured: false,
        rating: 4.1,
        discount_percentage: 5,
        sales_count: 19,
        sku: 'LAMP-008',
        tags: ['lighting', 'desk', 'led']
      },
      {
        name: 'Bestselling Novel',
        price: 14.99,
        description: 'The latest bestseller everyone is talking about. A captivating story of mystery and adventure.',
        image_url: 'https://source.unsplash.com/random/800x600/?book',
        category_id: categoryMap.get('Books'),
        inventory_count: 40,
        featured: false,
        rating: 4.9,
        discount_percentage: null,
        sales_count: 67,
        sku: 'BOOK-009',
        tags: ['fiction', 'bestseller', 'hardcover']
      },
      {
        name: 'Facial Serum',
        price: 24.99,
        description: 'Hydrating serum for all skin types. Formulated with hyaluronic acid and vitamin C for radiant skin.',
        image_url: 'https://source.unsplash.com/random/800x600/?skincare',
        category_id: categoryMap.get('Beauty'),
        inventory_count: 35,
        featured: false,
        rating: 4.5,
        discount_percentage: null,
        sales_count: 42,
        sku: 'SKIN-010',
        tags: ['skincare', 'beauty', 'facial']
      },
      {
        name: 'Wireless Headphones',
        price: 129.99,
        description: 'Over-ear headphones with active noise cancellation. Enjoy immersive sound with 30 hours of battery life.',
        image_url: 'https://source.unsplash.com/random/800x600/?headphones',
        category_id: categoryMap.get('Electronics'),
        inventory_count: 15,
        featured: true,
        rating: 4.7,
        discount_percentage: 20,
        sales_count: 38,
        sku: 'HEAD-011',
        tags: ['audio', 'bluetooth', 'wireless']
      },
      {
        name: 'Graphic T-Shirt',
        price: 19.99,
        description: 'Soft cotton t-shirt with unique design. Comfortable fit and machine washable.',
        image_url: 'https://source.unsplash.com/random/800x600/?tshirt',
        category_id: categoryMap.get('Fashion'),
        inventory_count: 50,
        featured: false,
        rating: 4.2,
        discount_percentage: null,
        sales_count: 29,
        sku: 'SHRT-012',
        tags: ['clothing', 'casual', 'cotton']
      },
      {
        name: 'Fitness Tracker',
        price: 49.99,
        description: 'Monitor your activity and health metrics. Tracks steps, heart rate, sleep, and more with app connectivity.',
        image_url: 'https://source.unsplash.com/random/800x600/?fitnesstracker',
        category_id: categoryMap.get('Electronics'),
        inventory_count: 28,
        featured: false,
        rating: 4.3,
        discount_percentage: 10,
        sales_count: 45,
        sku: 'FITB-013',
        tags: ['fitness', 'wearable', 'tracking']
      },
      {
        name: 'Ceramic Plant Pot',
        price: 18.99,
        description: 'Modern ceramic pot for indoor plants. Minimalist design with drainage hole and saucer included.',
        image_url: 'https://source.unsplash.com/random/800x600/?plantpot',
        category_id: categoryMap.get('Home'),
        inventory_count: 32,
        featured: false,
        rating: 4.4,
        discount_percentage: null,
        sales_count: 22,
        sku: 'PLNT-014',
        tags: ['home', 'decor', 'gardening']
      },
      {
        name: 'Moisturizing Cream',
        price: 22.99,
        description: 'Rich moisturizer for dry skin. Non-greasy formula with natural ingredients for deep hydration.',
        image_url: 'https://source.unsplash.com/random/800x600/?moisturizer',
        category_id: categoryMap.get('Beauty'),
        inventory_count: 45,
        featured: false,
        rating: 4.6,
        discount_percentage: null,
        sales_count: 33,
        sku: 'MSTR-015',
        tags: ['skincare', 'beauty', 'cream']
      },
      {
        name: 'Running Shoes',
        price: 79.99,
        description: 'Lightweight and supportive running shoes. Cushioned soles and breathable material for comfort during workouts.',
        image_url: 'https://source.unsplash.com/random/800x600/?runningshoes',
        category_id: categoryMap.get('Sports'),
        inventory_count: 18,
        featured: true,
        rating: 4.8,
        discount_percentage: 15,
        sales_count: 56,
        sku: 'SHOE-016',
        tags: ['footwear', 'running', 'athletic']
      }
    ];

    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (productsError) {
      throw productsError;
    }

    console.log(`Inserted ${insertedProducts?.length || 0} products`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Execute the seeding function
seedDatabase();