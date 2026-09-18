# Landing Page Components

This directory contains all the components for the HostelEase landing page.

## Component Hierarchy

```
LandingPage.tsx (Main Container)
├── Navbar.tsx
├── Hero.tsx
├── ProblemSolution.tsx
├── Features.tsx
├── HowItWorks.tsx
├── UserRoles.tsx
├── DashboardPreview.tsx
├── TrustValue.tsx
├── FinalCTA.tsx
└── Footer.tsx
```

## Component Details

### Navbar.tsx
**Purpose**: Fixed navigation bar with smooth scrolling  
**Features**:
- Logo
- Navigation links (Home, Features, How It Works, About)
- Login button
- Get Started button
- Mobile hamburger menu
- Smooth scroll to sections

**Props**: None  
**State**: `isOpen` (mobile menu toggle)

---

### Hero.tsx
**Purpose**: First section users see - main value proposition  
**Features**:
- Compelling headline
- Supporting description
- Two CTAs (Get Started, Explore Features)
- Dashboard preview mockup with stats
- Responsive two-column layout

**Props**: None  
**State**: None

---

### ProblemSolution.tsx
**Purpose**: Explain the value proposition  
**Features**:
- Three benefit cards
- Icons for each benefit
- Clean grid layout

**Props**: None  
**State**: None

---

### Features.tsx
**Purpose**: Showcase main features  
**Features**:
- Six feature cards with icons
- Student Management
- Room Management
- Outing Management
- Complaint Management
- Attendance Management
- Food Menu

**Props**: None  
**State**: None

---

### HowItWorks.tsx
**Purpose**: Show the user journey in 3 steps  
**Features**:
- Step 1: Register and Login
- Step 2: Manage Hostel Activities
- Step 3: Stay Organized
- Visual step indicators
- Connecting lines between steps

**Props**: None  
**State**: None

---

### UserRoles.tsx
**Purpose**: Show benefits for different user types  
**Features**:
- Student benefits (6 items)
- Administrator benefits (6 items)
- Two-column card layout
- Checkmark icons for each benefit

**Props**: None  
**State**: None

---

### DashboardPreview.tsx
**Purpose**: Show a realistic dashboard mockup  
**Features**:
- Sidebar navigation
- Statistics cards
- Attendance summary
- Recent activity section
- Production-quality appearance

**Props**: None  
**State**: None

---

### TrustValue.tsx
**Purpose**: Build trust and show value  
**Features**:
- Organized Hostel Operations
- Improved Student Experience
- Centralized Management
- Three value cards with icons

**Props**: None  
**State**: None

---

### FinalCTA.tsx
**Purpose**: Final conversion push  
**Features**:
- Gradient background
- Prominent headline
- Two CTAs (Get Started, Explore Features)
- High-contrast design

**Props**: None  
**State**: None

---

### Footer.tsx
**Purpose**: Site footer with links and info  
**Features**:
- Company information
- Navigation links
- Feature list
- Get Started section
- Contact info placeholder
- Copyright notice

**Props**: None  
**State**: None

---

## Styling Approach

All components use:
- **Tailwind CSS** utility classes
- **Responsive design** (mobile-first)
- **Consistent spacing** (py-20 for sections)
- **Color palette**: Indigo/Blue accents, Gray text
- **Typography**: System font stack
- **Shadows**: Subtle elevation effects
- **Transitions**: Smooth hover effects

## Icons

All icons come from **Lucide React**:
```typescript
import { Users, Home, LogOut, MessageSquare, Calendar, UtensilsCrossed } from 'lucide-react'
```

## Smooth Scrolling

Navigation uses smooth scroll with offset:
```typescript
const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    const offset = 80
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' })
  }
}
```

## Section IDs

For smooth scrolling navigation:
- `#home` → Hero section
- `#features` → Features section
- `#how-it-works` → How It Works section
- `#about` → Trust & Value section

## Responsive Breakpoints

```css
- Mobile: default (< 640px)
- sm: 640px
- md: 768px (tablets)
- lg: 1024px (desktop)
- xl: 1280px
```

## Color Classes Used

```css
Primary: bg-indigo-600, text-indigo-600
Hover: hover:bg-indigo-700
Background: bg-white, bg-gray-50
Text: text-gray-900, text-gray-600
Borders: border-gray-200
```

## Common Patterns

### Card Pattern
```tsx
<div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
  {/* content */}
</div>
```

### Icon Container Pattern
```tsx
<div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
  <Icon className="text-indigo-600" size={28} />
</div>
```

### Button Pattern
```tsx
<Link
  to="/register"
  className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition-colors"
>
  Get Started
</Link>
```

## Best Practices

1. **Component Isolation**: Each component is self-contained
2. **No Props**: Components don't depend on external data
3. **Default Exports**: Using `export default` for easier imports
4. **TypeScript**: All components are typed
5. **Accessibility**: Semantic HTML and ARIA labels where needed
6. **Performance**: No heavy dependencies or complex state

## Modifying Components

To customize:

1. **Content**: Edit text directly in components
2. **Colors**: Update Tailwind classes
3. **Layout**: Modify grid/flex properties
4. **Icons**: Import different icons from Lucide
5. **Data**: Update mock data in Hero and DashboardPreview

## Testing Locally

```bash
cd frontend
npm run dev
# Visit http://localhost:5173
```

## Build for Production

```bash
cd frontend
npm run build
# Output in frontend/dist
```
