# Color System - HRMS Pro

## Bộ màu chính từ Landing Page

### Primary Colors
- **brandBlue** (Primary): `#00358F` - Xanh dương chủ đạo
- **secondary** (Orange): `#f66600` - Cam nhấn mạnh
- **brandRed**: Đỏ (gradient với orange)

### Supporting Colors
- **brandLightBlue**: `#AECCFF` - Xanh nhạt
- **accent**: `#AECCFF` - Màu nhấn
- **success**: `#10b981` - Xanh lá (success)
- **warning**: `#f59e0b` - Vàng (warning)
- **error**: `#ef4444` - Đỏ (error)

### Neutral Colors
- **primary** (Text): `#00358F` - Text chính
- **slate-50** to **slate-900**: Xám các cấp độ

## Quy tắc sử dụng

### Buttons
✅ **Primary Button**: `bg-brandBlue hover:bg-blue-700 text-white`
✅ **Secondary Button**: `bg-secondary hover:bg-orange-600 text-white`
✅ **Outline Button**: `border-2 border-brandBlue text-brandBlue hover:bg-brandBlue hover:text-white`
❌ **KHÔNG dùng gradient**: `bg-gradient-to-br from-brandBlue to-blue-600`

### Cards & Containers
✅ **Card**: `bg-white border border-slate-200 rounded-2xl hover:border-brandBlue/30 hover:shadow-lg`
✅ **Card Active**: `border-brandBlue bg-brandBlue/5`
✅ **Card Hover**: `hover:border-secondary/50 hover:shadow-secondary/10`

### Badges & Tags
✅ **Info**: `bg-blue-50 text-blue-700 border border-blue-200`
✅ **Success**: `bg-green-50 text-green-700 border border-green-200`
✅ **Warning**: `bg-orange-50 text-orange-700 border border-orange-200`
✅ **Error**: `bg-red-50 text-red-700 border border-red-200`

### Icons & Accents
✅ **Primary Icon**: `text-brandBlue`
✅ **Secondary Icon**: `text-secondary`
✅ **Icon Background**: `bg-brandBlue/10` hoặc `bg-secondary/10`

### Borders & Dividers
✅ **Default Border**: `border-slate-200`
✅ **Hover Border**: `hover:border-brandBlue`
✅ **Active Border**: `border-brandBlue`
✅ **Accent Border**: `border-secondary`

### Backgrounds
✅ **Page Background**: `bg-offWhite` hoặc `bg-slate-50`
✅ **Card Background**: `bg-white`
✅ **Hover Background**: `hover:bg-slate-50`
✅ **Active Background**: `bg-brandBlue/5`

### Text Colors
✅ **Heading**: `text-primary` (#00358F)
✅ **Body**: `text-slate-700`
✅ **Muted**: `text-slate-500`
✅ **Link**: `text-brandBlue hover:text-blue-700`
✅ **Accent**: `text-secondary`

## Examples

### Button Variants
```tsx
// Primary
<button className="px-4 py-2 bg-brandBlue hover:bg-blue-700 text-white rounded-lg transition-colors">
  Primary
</button>

// Secondary
<button className="px-4 py-2 bg-secondary hover:bg-orange-600 text-white rounded-lg transition-colors">
  Secondary
</button>

// Outline
<button className="px-4 py-2 border-2 border-brandBlue text-brandBlue hover:bg-brandBlue hover:text-white rounded-lg transition-all">
  Outline
</button>

// Ghost
<button className="px-4 py-2 text-brandBlue hover:bg-brandBlue/10 rounded-lg transition-colors">
  Ghost
</button>
```

### Card Variants
```tsx
// Default Card
<div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-brandBlue/30 hover:shadow-lg transition-all">
  Content
</div>

// Active Card
<div className="bg-white border-2 border-brandBlue rounded-2xl p-6 shadow-lg">
  Active Content
</div>

// Accent Card
<div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-secondary/50 hover:shadow-secondary/10 transition-all">
  Hover with accent
</div>
```

### Badge Variants
```tsx
// Info
<span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium">
  Info
</span>

// Success
<span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium">
  Success
</span>

// Warning
<span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-sm font-medium">
  Warning
</span>
```

## Migration Checklist

### Phase 1: Core Components
- [ ] Buttons (all variants)
- [ ] Cards (dashboard, lists)
- [ ] Badges & Tags
- [ ] Icons & Icon Backgrounds

### Phase 2: Dashboard
- [ ] Quick Actions
- [ ] Overview Cards
- [ ] Charts & Graphs
- [ ] Tables

### Phase 3: Forms
- [ ] Input Fields
- [ ] Select Dropdowns
- [ ] Checkboxes & Radios
- [ ] Form Buttons

### Phase 4: Navigation
- [ ] Sidebar
- [ ] Top Header
- [ ] Breadcrumbs
- [ ] Tabs

## Notes
- Luôn dùng `transition-colors` hoặc `transition-all` cho smooth animations
- Dùng `hover:` states cho tất cả interactive elements
- Dùng `border` thay vì `shadow` cho subtle emphasis
- Dùng `/10`, `/20`, `/30` opacity cho backgrounds nhẹ
