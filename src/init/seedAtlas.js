const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require("mongoose");
const { Listing } = require("../models/listing.js");
const User = require("../models/user.js");
const Review = require("../models/review.js");

const ATLAS_URI = process.env.ATLASDB_URL || "mongodb+srv://anushka:Anushka06@cluster0.gcnce.mongodb.net/wanderlust?retryWrites=true&w=majority";

const richListings = [
  {
    title: "Luxury Beachfront Villa",
    description: "Experience coastal paradise in this stunning beachfront villa featuring a private infinity pool, panoramic Arabian Sea views, sun loungers, and direct private beach access.",
    image: {
      url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
      filename: "beach-villa-1"
    },
    price: 15500,
    location: "Candolim, Goa",
    country: "India",
    category: "Beaches",
    roomLimit: 4,
    geometry: { type: "Point", coordinates: [73.7634, 15.5177] }
  },
  {
    title: "Himalayan Alpine Chalet",
    description: "Nestled amidst cedar pine forests, this wooden chalet offers warm fireplace hearths, private balconies overlooking snow-capped peaks, and guided trekking trails.",
    image: {
      url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80",
      filename: "mountain-cabin-1"
    },
    price: 8500,
    location: "Old Manali, Himachal Pradesh",
    country: "India",
    category: "Mountains",
    roomLimit: 3,
    geometry: { type: "Point", coordinates: [77.1861, 32.2432] }
  },
  {
    title: "Royal Heritage Fort Palace",
    description: "Step into 300 years of royal grandeur. Features jharokha balconies, traditional Marwari cuisine dining, sprawling courtyard gardens, and sunset terrace views.",
    image: {
      url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80",
      filename: "castle-suite-1"
    },
    price: 22000,
    location: "Jaipur, Rajasthan",
    country: "India",
    category: "Castles",
    roomLimit: 5,
    geometry: { type: "Point", coordinates: [75.7873, 26.9124] }
  },
  {
    title: "Downtown Glasshouse Penthouse",
    description: "Ultra-modern duplex penthouse overlooking the city skyline. Features floor-to-ceiling glass windows, high-speed Wi-Fi, smart lighting, and rooftop lounge.",
    image: {
      url: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&auto=format&fit=crop&q=80",
      filename: "urban-loft-1"
    },
    price: 9800,
    location: "Bandra West, Mumbai",
    country: "India",
    category: "Heart of the City",
    roomLimit: 2,
    geometry: { type: "Point", coordinates: [72.8333, 19.0544] }
  },
  {
    title: "Mist & Canopy Forest Lodge",
    description: "Immerse in tranquility at this secluded coffee plantation lodge. Features open-air jacuzzi, birdsong mornings, organic estate breakfast, and nature walks.",
    image: {
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
      filename: "forest-cottage-1"
    },
    price: 7200,
    location: "Madikeri, Coorg",
    country: "India",
    category: "Forest Resorts",
    roomLimit: 3,
    geometry: { type: "Point", coordinates: [75.7333, 12.4200] }
  },
  {
    title: "Valley View Vineyard Estate",
    description: "Stay in the heart of lush grape orchards. Includes complimentary wine tasting tours, cellar master sessions, and farm-to-table gourmet dining.",
    image: {
      url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=80",
      filename: "vineyard-estate-1"
    },
    price: 13500,
    location: "Nashik, Maharashtra",
    country: "India",
    category: "Vineyards",
    roomLimit: 4,
    geometry: { type: "Point", coordinates: [73.7898, 20.0059] }
  },
  {
    title: "Nomad Backpackers Pod",
    description: "Clean, vibrant, and minimalist budget pods designed for digital nomads. Includes high-speed fiber internet, co-working space access, and community kitchen.",
    image: {
      url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80",
      filename: "budget-hostel-1"
    },
    price: 1200,
    location: "Hauz Khas, New Delhi",
    country: "India",
    category: "Budget Rooms",
    roomLimit: 1,
    geometry: { type: "Point", coordinates: [77.2060, 28.5494] }
  },
  {
    title: "Tea Plantation Heritage B&B",
    description: "Charming colonial bungalow nestled amidst rolling tea gardens. Sip freshly brewed artisanal tea on the wrap-around veranda while misty clouds roll by.",
    image: {
      url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
      filename: "bed-breakfast-1"
    },
    price: 4800,
    location: "Munnar, Kerala",
    country: "India",
    category: "Bed & Breakfasts",
    roomLimit: 2,
    geometry: { type: "Point", coordinates: [77.0597, 10.0889] }
  },
  {
    title: "Clifftop Sunset Villa",
    description: "Perched dramatically over red seaside cliffs, this eco-resort features open bamboo architecture, yoga decks, fresh seafood dining, and private beach pathways.",
    image: {
      url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80",
      filename: "beach-villa-2"
    },
    price: 16800,
    location: "Varkala Cliff, Kerala",
    country: "India",
    category: "Beaches",
    roomLimit: 3,
    geometry: { type: "Point", coordinates: [76.7163, 8.7379] }
  },
  {
    title: "Portuguese Heritage Manor",
    description: "Restored 19th-century Portuguese villa with high wooden ceilings, hand-painted Azulejo tiles, private swimming pool, and tropical courtyard garden.",
    image: {
      url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80",
      filename: "trending-villa-1"
    },
    price: 18900,
    location: "Assagao, North Goa",
    country: "India",
    category: "Trending",
    roomLimit: 4,
    geometry: { type: "Point", coordinates: [73.7820, 15.5900] }
  },
  {
    title: "Udaipur Lakefront Haveli",
    description: "Overlooking the tranquil waters of Lake Pichola and the City Palace. Enjoy rooftop candlelight dinners, traditional folk performances, and royal hospitality.",
    image: {
      url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80",
      filename: "castle-haveli-2"
    },
    price: 24500,
    location: "Udaipur, Rajasthan",
    country: "India",
    category: "Castles",
    roomLimit: 4,
    geometry: { type: "Point", coordinates: [73.6833, 24.5854] }
  },
  {
    title: "Silicon Valley Tech Hub Loft",
    description: "Sleek, minimalist studio located in the tech heart of Indiranagar. Smart locks, ergonomic workstation, 4K projector entertainment, and espresso bar.",
    image: {
      url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80",
      filename: "city-loft-2"
    },
    price: 6500,
    location: "Indiranagar, Bengaluru",
    country: "India",
    category: "Heart of the City",
    roomLimit: 2,
    geometry: { type: "Point", coordinates: [77.6412, 12.9784] }
  },
  {
    title: "Treehouse Eco-Resort Sanctuary",
    description: "Suspended 30 feet above the forest floor among giant banyan branches. Listen to stream waters and tropical bird calls from your private open canopy hammock.",
    image: {
      url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop&q=80",
      filename: "forest-treehouse"
    },
    price: 11000,
    location: "Vythiri, Wayanad",
    country: "India",
    category: "Forest Resorts",
    roomLimit: 2,
    geometry: { type: "Point", coordinates: [76.0384, 11.5524] }
  },
  {
    title: "Sunlit Hilltop Studio",
    description: "Budget-friendly, cozy hilltop studio with sweeping views of the valley. Includes private balcony, tea kettle, solar water heating, and high-speed Wi-Fi.",
    image: {
      url: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?w=1200&auto=format&fit=crop&q=80",
      filename: "budget-studio"
    },
    price: 2200,
    location: "Shimla, Himachal Pradesh",
    country: "India",
    category: "Budget Rooms",
    roomLimit: 1,
    geometry: { type: "Point", coordinates: [77.1734, 31.1048] }
  },
  {
    title: "Highland Organic Vineyard Cottage",
    description: "Boutique vineyard cottage nestled in wine country. Wake up to fresh mountain air, enjoy artisanal cheese platters, and walk through private estate vines.",
    image: {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80",
      filename: "vineyard-cottage-2"
    },
    price: 14200,
    location: "Solan, Himachal Pradesh",
    country: "India",
    category: "Vineyards",
    roomLimit: 3,
    geometry: { type: "Point", coordinates: [77.1089, 30.9084] }
  },
  {
    title: "Botanical Garden Heritage B&B",
    description: "Quaint colonial B&B surrounded by century-old botanical gardens. Homemade berry jams, roaring brick fireplaces, and afternoon high-tea served daily.",
    image: {
      url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200&auto=format&fit=crop&q=80",
      filename: "bed-breakfast-2"
    },
    price: 5200,
    location: "Ooty, Tamil Nadu",
    country: "India",
    category: "Bed & Breakfasts",
    roomLimit: 2,
    geometry: { type: "Point", coordinates: [76.6937, 11.4102] }
  }
];

async function seedAtlasDB() {
  try {
    let connectionUri = ATLAS_URI;
    if (!connectionUri.includes('/wanderlust') && connectionUri.includes('mongodb.net/?')) {
      connectionUri = connectionUri.replace('mongodb.net/?', 'mongodb.net/wanderlust?');
    }
    console.log("Connecting to Atlas DB...");
    await mongoose.connect(connectionUri);
    console.log("Connected to Atlas DB successfully!");

    // Find or create default admin/owner user
    let ownerUser = await User.findOne({ username: "anushka" });
    if (!ownerUser) {
      console.log("Creating default owner user: anushka...");
      const newUser = new User({ email: "anushkad8178@gmail.com", username: "anushka" });
      ownerUser = await User.register(newUser, "Password@123");
    }

    // Clear old listings and reviews
    await Listing.deleteMany({});
    await Review.deleteMany({});
    console.log("Cleared existing listings and reviews.");

    const sampleReviewTexts = [
      { rating: 5, comment: "Absolutely breathtaking views and top-notch hospitality! Will definitely visit again." },
      { rating: 5, comment: "Super clean rooms, seamless check-in, and peaceful vibes. Highly recommended!" },
      { rating: 4, comment: "Great location and wonderful amenities. Loved the breakfast spread!" },
      { rating: 5, comment: "A hidden gem! Perfect for a relaxing weekend getaway with family." }
    ];

    const seededListings = [];
    for (let listingData of richListings) {
      const reviewDocs = [];
      for (let i = 0; i < 2; i++) {
        const revData = sampleReviewTexts[(seededListings.length + i) % sampleReviewTexts.length];
        const newReview = new Review({
          rating: revData.rating,
          comment: revData.comment,
          author: ownerUser._id
        });
        await newReview.save();
        reviewDocs.push(newReview._id);
      }

      const newListing = new Listing({
        ...listingData,
        owner: ownerUser._id,
        reviews: reviewDocs
      });
      await newListing.save();
      seededListings.push(newListing);
    }

    console.log(`SUCCESS_SEEDED_${seededListings.length}`);
    process.exit(0);
  } catch (err) {
    console.error("SEED_ERROR:", err);
    process.exit(1);
  }
}

seedAtlasDB();
