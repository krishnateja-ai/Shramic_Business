# 🚀 Shramic Business - Next.js Migration

## 📋 Project Overview
This is a migration of the Shramic Business seller portal from vanilla HTML/CSS/JS to Next.js with TypeScript and Tailwind CSS.

## ✨ Features
1. 🔐 **Seller Portal** with OTP authentication
2. 📊 **Business Dashboard** with analytics and stats  
3. 💬 **Customer Chat System** for business communications
4. 📝 **Quotation Management** for handling customer quotes
5. 👤 **Business Profile** with editing capabilities
6. 📋 **Multi-step Registration** form for new businesses
7. 🎨 **Responsive Design** with Tailwind CSS
8. ⚡ **Next.js 14** with App Router and TypeScript

## 🛠️ Technology Stack
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Font Awesome 6 + Custom SVGs
- **Fonts:** Inter from Google Fonts
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore
- **Deployment:** Vercel (recommended)

## 📥 Installation & Setup

### Prerequisites
- Node.js 18.17 or later
- npm or yarn package manager

### Installation Steps
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shramic-business-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Update Firebase configuration
   ```bash
   copy .env.example .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure
```
shramic-business-next/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── dashboard/       # Dashboard page
│   │   ├── chats/           # Customer chats
│   │   ├── quotations/      # Quotation management
│   │   ├── profile/         # Business profile
│   │   ├── register/        # Registration flow
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home/Landing page
│   └── components/          # Reusable components
├── public/                  # Static assets
│   ├── assets/             # Configuration & static files
│   ├── images/             # Image assets
│   └── icons/              # SVG icons
├── .env.local              # Environment variables
├── .env.example            # Environment template
└── package.json           # Dependencies
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import repository at [vercel.com](https://vercel.com)
3. Add environment variables in dashboard
4. Deploy automatically

### Environment Variables for Production
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_URL` - Production URL

## 🔧 Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License
MIT License - see LICENSE file for details


**Repository**: https://github.com/krishnateja-ai/Shramic_Business
**Email**: krishnateja.aiml@gmail.com


### For Business:
**Shramic Networks Private Limited**
**Email**: shramic@gmail.com
