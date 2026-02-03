const sampleListings = [
  {
    title: "Luxury Beachfront Villa",
    description: "Stunning beachfront villa with private pool and ocean views. Perfect for family vacations or romantic getaways.",
    image: {
      url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmVhY2glMjBob3VzZXxlbnwwfHwwfHx8MA%3D%3D",
      filename: "beach-villa"
    },
    price: 15000,
    location: "Goa",
    country: "India",
    category: "Beaches",
    geometry: {
      type: "Point",
      coordinates: [73.8278, 15.2993]
    }
  },
  {
    title: "Mountain View Cabin",
    description: "Cozy cabin nestled in the Himalayas with breathtaking mountain views. Perfect for nature lovers and adventure seekers.",
    image: {
      url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW91bnRhaW4lMjBob3VzZXxlbnwwfHwwfHx8MA%3D%3D",
      filename: "mountain-cabin"
    },
    price: 8000,
    location: "Manali",
    country: "India",
    category: "Mountains",
    geometry: {
      type: "Point",
      coordinates: [77.1861, 32.2432]
    }
  },
  {
    title: "Historic Castle Suite",
    description: "Experience royal living in this beautifully restored castle suite. Rich in history and modern amenities.",
    image: {
      url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FzdGxlfGVufDB8fDB8fHww",
      filename: "castle-suite"
    },
    price: 20000,
    location: "Jaipur",
    country: "India",
    category: "Castles",
    geometry: {
      type: "Point",
      coordinates: [75.7873, 26.9124]
    }
  },
  {
    title: "Urban Loft Apartment",
    description: "Modern loft apartment in the heart of the city. Close to all major attractions and nightlife.",
    image: {
      url: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXJiYW4lMjBhcGFydG1lbnR8ZW58MHx8MHx8fDA%3D",
      filename: "urban-loft"
    },
    price: 5000,
    location: "Mumbai",
    country: "India",
    category: "Heart of the City",
    geometry: {
      type: "Point",
      coordinates: [72.8777, 19.0760]
    }
  },
  {
    title: "Forest Retreat Cottage",
    description: "Peaceful cottage surrounded by lush greenery. Perfect for meditation and relaxation.",
    image: {
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zm9yZXN0JTIwaG91c2V8ZW58MHx8MHx8fDA%3D",
      filename: "forest-cottage"
    },
    price: 6000,
    location: "Coorg",
    country: "India",
    category: "Forest Resorts",
    geometry: {
      type: "Point",
      coordinates: [75.7333, 12.4200]
    }
  },
  {
    title: "Vineyard Estate",
    description: "Beautiful estate in the middle of a working vineyard. Wine tasting and tours included.",
    image: {
      url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dmluZXlhcmR8ZW58MHx8MHx8fDA%3D",
      filename: "vineyard-estate"
    },
    price: 12000,
    location: "Nashik",
    country: "India",
    category: "Vineyards",
    geometry: {
      type: "Point",
      coordinates: [73.7898, 20.0059]
    }
  },
  {
    title: "Budget Hostel Room",
    description: "Clean and comfortable budget accommodation in the city center. Great for backpackers.",
    image: {
      url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aG9zdGVsfGVufDB8fDB8fHww",
      filename: "budget-hostel"
    },
    price: 1000,
    location: "Delhi",
    country: "India",
    category: "Budget Rooms",
    geometry: {
      type: "Point",
      coordinates: [77.1025, 28.7041]
    }
  },
  {
    title: "Cozy Bed & Breakfast",
    description: "Charming B&B with homemade breakfast and warm hospitality. Perfect for a weekend getaway.",
    image: {
      url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmVkJTIwYW5kJTIwYnJlYWtmYXN0fGVufDB8fDB8fHww",
      filename: "bed-breakfast"
    },
    price: 3000,
    location: "Ooty",
    country: "India",
    category: "Bed & Breakfasts",
    geometry: {
      type: "Point",
      coordinates: [76.6937, 11.4102]
    }
  }
];

module.exports = { data: sampleListings };
