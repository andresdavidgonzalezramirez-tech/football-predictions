# SportMonks Predictions - Web App

A modern, professional web application for displaying football match predictions powered by the SportMonks API. Built with React, Vite, and Tailwind CSS v3.

## Features

- AI-powered match predictions
- Real-time fixture updates
- Dark mode support
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Professional sports betting aesthetic
- Comprehensive loading and error states

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router 7** - Client-side routing
- **Tailwind CSS v3** - Utility-first CSS framework
- **Axios** - HTTP client
- **SportMonks API** - Sports data provider

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- SportMonks API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sportsmonk-prediction
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Copy the example environment file
cp .env.example .env
```

4. Configure your API key:
   - Open `.env` in your editor
   - Replace `your_api_token_here` with your SportMonks API token
   - Save the file

```env
VITE_SPORTMONKS_API_TOKEN=your_actual_api_token_here
VITE_SPORTMONKS_API_BASE_URL=https://api.sportmonks.com/v3
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser to `http://localhost:5173`

## Project Structure

```
sportsmonk-prediction/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── FixtureCard.jsx
│   │   ├── PredictionDisplay.jsx
│   │   ├── OddsDisplay.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorState.jsx
│   │   ├── DarkModeToggle.jsx
│   │   ├── Navbar.jsx
│   │   └── index.js
│   ├── pages/                # Page components
│   │   ├── LandingPage.jsx
│   │   ├── FixtureDetailPage.jsx
│   │   └── index.js
│   ├── services/             # API services
│   │   └── sportsmonksApi.js
│   ├── index.css            # Global styles + Tailwind
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── public/                   # Static assets
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── vite.config.js           # Vite configuration
├── package.json
├── DESIGN_SYSTEM.md         # Design system documentation
├── SETUP_GUIDE.md           # Detailed setup guide
├── TAILWIND_QUICK_REFERENCE.md  # Tailwind class reference
└── PROJECT_SUMMARY.md       # Complete project summary
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Deployment

### Deploy to Vercel (Recommended)

This app is optimized for Vercel deployment. See the comprehensive deployment guide:

**[📖 Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)**

Quick deploy:
1. Push code to GitHub/GitLab/Bitbucket
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app includes `vercel.json` configuration for optimal performance and SPA routing.

## Design System

### Color Palette

- **Primary (Blue)**: Brand colors, CTAs, links
- **Success (Green)**: Win predictions, positive states
- **Warning (Yellow)**: Draw predictions, warnings
- **Danger (Red)**: Loss predictions, errors
- **Dark**: Full dark mode support

### Components

All components are documented in `DESIGN_SYSTEM.md`. Key components include:

- **FixtureCard**: Displays match information with predictions
- **PredictionDisplay**: Large, SportMonks-style prediction component
- **OddsDisplay**: Betting odds in a clean format
- **LoadingSkeleton**: Loading state animations
- **EmptyState**: No data placeholder
- **ErrorState**: Error message display
- **Navbar**: Navigation with dark mode toggle

### Animations

- Fade in/out effects
- Slide transitions
- Scale animations
- Shimmer effects
- Progress bar animations
- Hover effects

## Usage Examples

### Using Components

```jsx
import { FixtureCard, PredictionDisplay } from './components';

// Fixture card
<FixtureCard fixture={fixtureData} />

// Prediction display
<PredictionDisplay prediction={{ homeWin: 65, draw: 20, awayWin: 15 }} />
```

### Using Tailwind Classes

```jsx
// Card with hover effect
<div className="card-hover p-6">
  Content
</div>

// Primary button
<button className="btn-primary">
  Click me
</button>

// Progress bar
<div className="progress-bar">
  <div className="progress-fill-success" style={{ width: '65%' }}></div>
</div>
```

### Dark Mode

Dark mode is automatically enabled based on system preferences and can be toggled via the navbar. The state is persisted in localStorage.

```jsx
import { Navbar } from './components';

// Navbar includes dark mode toggle
<Navbar />
```

## API Integration

The app integrates with the SportMonks API using a **proxy architecture** to solve CORS issues:

```env
# .env file
VITE_SPORTMONKS_API_TOKEN=your_api_token
```

**Architecture**:
- **Development**: Vite proxy forwards `/api/*` requests to SportMonks API
- **Production**: Vercel serverless functions proxy requests (in `/api/` directory)

This approach:
- ✅ Eliminates CORS errors
- ✅ Keeps API token secure (server-side only)
- ✅ Works seamlessly in both environments

For detailed information about the CORS solution, see **[CORS_SOLUTION.md](./CORS_SOLUTION.md)**.

**Important**: Never commit your `.env` file to version control.

## Responsive Design

The app is fully responsive with breakpoints:

- **Mobile**: < 640px (default)
- **Tablet**: 768px+ (md:)
- **Desktop**: 1024px+ (lg:)
- **Large**: 1280px+ (xl:)

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Documentation

Comprehensive documentation is available:

- **DESIGN_SYSTEM.md** - Complete design system with examples
- **SETUP_GUIDE.md** - Detailed setup and implementation guide
- **TAILWIND_QUICK_REFERENCE.md** - Quick reference for Tailwind classes
- **PROJECT_SUMMARY.md** - Project overview and architecture
- **VERCEL_DEPLOYMENT.md** - Step-by-step Vercel deployment guide
- **CORS_SOLUTION.md** - Detailed explanation of CORS solution and proxy architecture
- **QUICK_START.md** - Quick start guide for getting up and running

## Customization

### Colors

Edit `tailwind.config.js` to customize colors:

```javascript
colors: {
  primary: {
    500: '#your-color',
    // ...
  }
}
```

### Fonts

Update font imports in `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=YourFont&display=swap');
```

### Components

All component styles use Tailwind classes and can be easily customized by modifying the className props or adding custom classes to `src/index.css`.

## Performance Optimization

- Lazy loading of routes (React.lazy)
- Code splitting by route
- Optimized images
- Efficient re-renders with React.memo
- CSS purging in production

## Accessibility

- WCAG AA compliant color contrast
- Keyboard navigation support
- Focus indicators
- Semantic HTML
- ARIA labels where needed
- Screen reader friendly

## Troubleshooting

### Tailwind styles not working

1. Verify `index.css` is imported in `main.jsx`
2. Check `tailwind.config.js` content paths
3. Restart dev server

### Dark mode not working

1. Check if `dark` class is on `<html>` element
2. Clear localStorage
3. Check browser console for errors

### API errors

1. Verify API key is correct
2. Check API endpoint URLs
3. Ensure CORS is configured
4. Check network tab in DevTools

## License

This project is private and proprietary.

## Acknowledgments

- **Tailwind CSS** - For the amazing utility-first CSS framework
- **SportMonks** - For providing comprehensive sports data API
- **React Team** - For the excellent UI library
- **Vite** - For the blazing fast build tool

---

**Version**: 1.0.0
**Last Updated**: 2025-10-19
**Status**: Production Ready
