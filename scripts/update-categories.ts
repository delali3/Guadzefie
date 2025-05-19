import { supabase } from '../src/lib/supabase';

async function updateCategories() {
  console.log('Starting category update...');

  try {
    // First, let's get existing categories
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${existingCategories?.length || 0} existing categories`);

    // Define new categories
    const updatedCategories = [
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
    ];

    // Update each category while preserving IDs
    for (let i = 0; i < Math.min(existingCategories.length, updatedCategories.length); i++) {
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name: updatedCategories[i].name,
          description: updatedCategories[i].description,
          slug: updatedCategories[i].slug,
          image_url: updatedCategories[i].image_url
        })
        .eq('id', existingCategories[i].id);

      if (updateError) {
        console.error(`Error updating category ID ${existingCategories[i].id}:`, updateError);
      } else {
        console.log(`Updated category ID ${existingCategories[i].id} to "${updatedCategories[i].name}"`);
      }
    }

    // If we have fewer existing categories than updated ones, insert the remaining
    if (existingCategories.length < updatedCategories.length) {
      const newCategories = updatedCategories.slice(existingCategories.length);
      const { data: insertedData, error: insertError } = await supabase
        .from('categories')
        .insert(newCategories)
        .select();

      if (insertError) {
        console.error('Error inserting new categories:', insertError);
      } else {
        console.log(`Inserted ${insertedData?.length || 0} new categories`);
      }
    }

    console.log('Category update completed successfully!');
  } catch (error) {
    console.error('Error updating categories:', error);
  }
}

// Run the function
updateCategories(); 