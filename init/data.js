const sampleListings = [
  {
    title: "Beach Paradise",
    location: "Goa",
    country: "India",
    description: "A beautiful beachfront property in Goa with stunning ocean views and modern amenities.",
    category: "Beaches",
    price: 3500,
    image: {
      url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z29hJTIwYmVhY2h8ZW58MHx8MHx8fDA%3D",
      filename: "goa_beach",
    },
    geometry: {
      type: "Point",
      coordinates: [73.8567, 15.2993] // Goa coordinates
    }
  },
  {
    title: "Mountain Bliss",
    location: "Swiss Alps",
    country: "Switzerland",
    description: "A cozy retreat nestled in the heart of the Swiss Alps with breathtaking views and endless outdoor adventures.",
    category: "Mountains",
    price: 2500,
    image: {
      url: "https://images.unsplash.com/photo-1706794543262-a013701e070c?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW91bnRhaW4lMjByZXNvcnR8ZW58MHx8MHx8fDA%3D",
      filename: "listingimage",
    },
    geometry: {
      type: "Point",
      coordinates: [8.2275, 46.8182] // Swiss Alps coordinates
    }
  },
  {
    title: "City Center Suite",
    location: "Mumbai",
    country: "India",
    description: "Luxurious apartment in the heart of Mumbai with easy access to all major attractions.",
    category: "Heart of the City",
    price: 4500,
    image: {
      url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      filename: "mumbai_apartment",
    },
    geometry: {
      type: "Point",
      coordinates: [72.8777, 19.0760] // Mumbai coordinates
    }
  },
  {
    title: "Budget Stay",
    location: "Goa",
    country: "India",
    description: "Comfortable and affordable accommodation perfect for backpackers in North Goa.",
    category: "Budget Rooms",
    price: 1200,
    image: {
      url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      filename: "budget_stay",
    },
    geometry: {
      type: "Point",
      coordinates: [73.8223, 15.4909] // North Goa coordinates
    }
  }
];

module.exports={data:sampleListings};
