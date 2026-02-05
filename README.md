🌍 **Wanderlust**<br><br>
Wanderlust is your ultimate travel companion! Inspired by Airbnb, this full-stack web application allows users to explore 🏡, list 📝, and book ✈️ unique stays across the globe. Built with the powerful MERN stack, it delivers a seamless and interactive experience.<br><br>

✨ **Features**<br>
🔐 User Authentication: Secure login and registration using passport-local and express-session.<br>
🏙️ Dynamic Listings: Add, update, or delete stays with images stored in Cloudinary.<br>
🗺️ Interactive Map: Powered by Mapbox for location-based searches.<br>
🔍 Search by Location: Find stays in your dream city or region.<br>
📱 Responsive Design: Beautiful UI across all devices.<br><br>
🛠️ **Tech Stack**<br><br>
**Frontend**<br>
⚛️ React.js: Builds the dynamic UI.<br>
✨ EJS (server-side rendering): Templates for initial views.<br>
🎨 Bootstrap: Ensures a polished, responsive design.<br><br>
**Backend**<br>
🛡️ Node.js & Express.js: Power the server-side logic.<br>
🧾 Joi: Validates user inputs like a pro.<br>
🔄 Method-Override: Enables PUT and DELETE HTTP methods.<br><br>
**Database**<br>
🗃️ MongoDB (with Mongoose): Stores and manages data securely.<br><br>
**Image Uploads**<br>
☁️ Cloudinary: Handles image storage and delivery.<br><br>
**Mapping**<br>
🗺️ Mapbox SDK: Adds location-based magic.<br><br>
**Session Management**<br>
💬 Connect-Flash: Flash messages for user feedback.<br>
🛡️ Connect-Mongo: Securely stores sessions in MongoDB.<br><br>

---

## Deploy (Render)

1. **Push your code to GitHub** (ensure `.env` is in `.gitignore` and is not committed).

2. **Sign up at [Render](https://render.com)** and connect your GitHub repo.

3. **New → Web Service** → select this repo. Render will detect Node and use `npm install` and `npm start`.

4. **Set environment variables** in the Render dashboard (Settings → Environment):
   - `NODE_ENV` = `production`
   - `ATLASDB_URL` = your MongoDB Atlas connection string (use standard connection string, not SRV)
   - `SECRET` = a long random string for sessions
   - `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` = Cloudinary credentials
   - `MAPTOKEN` = your Mapbox public token
   - `RAZORPAY_KEY_ID` = your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET` = your Razorpay Key Secret

5. **Deploy.** Render will build and run the app; your URL will be like `https://majorproject-xxxx.onrender.com`.

**Note:** On the free tier the app may sleep after inactivity; the first request after sleep can take 30–60 seconds.
