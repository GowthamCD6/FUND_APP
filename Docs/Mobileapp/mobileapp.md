# GDKChit Mobile App — UI Theme & Color Reference

> **Framework**: React Native (JSX)  
> **Styling**: `StyleSheet.create()` — inline style objects per screen/component  
> **Theme Provider**: Currently commented out (`<ThemeProvider>` in `App.jsx`), so all colors are hard-coded per file.

---

## Table of Contents

1. [Color Palette](#1-color-palette)
2. [Typography](#2-typography)
3. [Spacing & Border Radius](#3-spacing--border-radius)
4. [Shadows & Elevation](#4-shadows--elevation)
5. [Status / Semantic Colors](#5-status--semantic-colors)
6. [Screen-by-Screen Color Usage](#6-screen-by-screen-color-usage)
7. [Component Token Reference](#7-component-token-reference)
8. [Design Patterns & Conventions](#8-design-patterns--conventions)
9. [Project Directory & Folder Structure](#9-project-directory--folder-structure)

---

## 1. Color Palette

### 1.1 Primary Colors (Purple Family)

The app's primary brand identity is **purple**, used for headers, buttons, active states, and accent elements.

| Token Name              | Hex Code    | Usage                                                  |
|-------------------------|-------------|--------------------------------------------------------|
| **Primary Deep**        | `#1A0C38`   | Splash screen background                               |
| **Primary Dark**        | `#2E1065`   | Finance hero gradient (very dark purple)                |
| **Primary Dark Alt**    | `#2D1654`   | Insurance button, dark accents                          |
| **Primary Header**      | `#411E73`   | Home top container background                           |
| **Primary Hero**        | `#4C1D95`   | Finance hero section base                               |
| **Primary**             | `#6B46C1`   | Main brand — tab buttons, stat values, plan cards, pay buttons, badges, progress bars, loading screen |
| **Primary Vivid**       | `#7C3AED`   | Chat bubbles (user), send button, filter tabs (active), CTA buttons, banners, FABs, role badges |
| **Primary Light Vivid** | `#8B5CF6`   | Finance hero gradient circle                            |
| **Primary Disabled**    | `#C4B5FD`   | Disabled send button                                    |

### 1.2 Purple Tints & Backgrounds

| Token Name                 | Hex Code                        | Usage                                  |
|----------------------------|---------------------------------|----------------------------------------|
| **Purple Tint Lightest**   | `#F5F3FF`                       | Feature icon wrapper bg                |
| **Purple Tint Light**      | `#F3E8FF`                       | Author avatar bg, member avatar bg, FAQ icon bg, chat avatar bg |
| **Purple Tint**            | `#EDE9FE`                       | Alert card border                      |
| **Purple Tint Medium**     | `#ECE9FE`                       | Permission badge bg                    |
| **Purple Border Light**    | `#E9D5FF`                       | Search bar border, input border, label line divider |
| **Purple Tint Strong**     | `#E8DEFF`                       | Insurance container bg                 |
| **Purple Border Card**     | `#F3E8FF`                       | Stat card border, archived count bg    |
| **Purple Shadow**          | `rgba(65, 30, 115, 0.15)`      | Inactive pagination dot                |

### 1.3 Secondary / Accent (Blue)

Used primarily on the **Login / Welcome** screens and fronter flow.

| Token Name           | Hex Code    | Usage                                         |
|----------------------|-------------|-----------------------------------------------|
| **Secondary Blue**   | `#2842C4`   | Login button, decorative line, input icons, active outline, forgot password, privacy link, signup link, error modal button |

### 1.4 Neutrals — Grays

| Token Name               | Hex Code    | Usage                                          |
|--------------------------|-------------|-------------------------------------------------|
| **Black**                | `#000000`   | Footer background, card values                  |
| **Gray 900**             | `#111827`   | Modal title, group info names, dark headings     |
| **Gray 850**             | `#1A1A2E`   | Login "Welcome Back" heading                     |
| **Gray 800**             | `#1E293B`   | Section titles, plan section titles, stat labels, explor titles, feature section titles |
| **Gray 750**             | `#1F2937`   | Screen text, header titles, chat names, input text, message text, dropdown text, form text, modal titles |
| **Gray 700**             | `#212121`   | Header component title, chit group section title |
| **Gray 650**             | `#1A202C`   | Updated group name                               |
| **Gray 600**             | `#2D3748`   | Chit value amount                                |
| **Gray 550**             | `#334155`   | Explore text                                     |
| **Gray 500**             | `#374151`   | Alert body, progress text, archived row text, perm label |
| **Gray 450**             | `#4A5568`   | Detail label                                     |
| **Gray 400**             | `#4A5E6D`   | Welcome title                                    |
| **Gray 350**             | `#4B5563`   | Checkbox text, modal message, testimonial text, benefit desc, form label, selector chip text |
| **Gray 300**             | `#555E6B`   | Insurance subtitle                               |
| **Gray 250**             | `#64748B`   | Explore subtitle                                 |
| **Gray 200**             | `#6B7280`   | Subtitle text, group info text, last message, error message, user list phone, portfolio group name, progress text, feature description, loading text |
| **Gray 175**             | `#718096`   | Detail value                                     |
| **Gray 150**             | `#757575`   | Section title (portfolio)                        |
| **Gray 100**             | `#9CA3AF`   | Timestamp, subtitle, empty subtext, recent label, chit value label, loading subtext |
| **Gray 75**              | `#A0AEC0`   | Chit value label                                 |

### 1.5 Neutral Backgrounds

| Token Name              | Hex Code    | Usage                                      |
|-------------------------|-------------|--------------------------------------------|
| **White**               | `#FFFFFF`   | Main page backgrounds, cards, tab bars, buttons, header bg, modals |
| **Off-White**           | `#FAFAFA`   | Finance container bg                        |
| **Light Gray 50**       | `#F9FAFB`   | Skeleton card bg, form input bg, input container bg, FAQ expanded, admin manage groups container |
| **Light Gray 100**      | `#F5F5F5`   | Tab container bg, summary card bg, selector chip bg, portfolio tab bg |
| **Light Gray 100 Alt**  | `#f5f5f5`   | Chat list container, chat screen bg         |
| **Light Gray 150**      | `#F5F5F7`   | Pro container bg                            |
| **Light Gray 200**      | `#F3F4F6`   | Filter tabs bg, dismiss btn bg, screen container bg (tabs), skeleton shimmer |
| **Light Gray 250**      | `#F3F0F7`   | Chat header action button bg                |
| **Light Gray 300**      | `#F1F5F9`   | Feature item bottom border                  |
| **Light Gray 350**      | `#F0F3F7`   | Circle icon bg (portfolio)                  |
| **Light Gray 400**      | `#E5E7EB`   | Features container border, filter tab border, progress bar bg, skeleton title/badge bg, group card border, chat other bubble border, avatar circle bg, benefit card border, typing bubble bg, form input border |
| **Light Gray 500**      | `#E0E0E0`   | Section divider, divider                    |
| **Light Gray 550**      | `#D1D5DB`   | Checkbox border, inactive dot, group selector divider |
| **Separator Gray**      | `#d7dce4ff` | Header separator line                       |

### 1.6 Accent / Highlight Colors

| Token Name          | Hex Code        | Usage                                        |
|---------------------|-----------------|----------------------------------------------|
| **Gold / Amber**    | `#FFD54F`       | Splash tagline text, brand logo gold accent   |
| **Gold Light**      | `#FDE68A`       | Hero subtitle, return amount on plan cards    |
| **Amber Warm**      | `#FBBF24`       | Finance hero tag text/border                  |
| **Amber Dark**      | `#92400E`       | Rating badge text                             |
| **Amber Bg**        | `#FEF3C7`       | Rating badge container bg                     |
| **Pink / Magenta**  | `#EC4899`       | "NEW" badge                                   |
| **WhatsApp Green**  | `#00A884`       | WhatsApp button text                          |

### 1.7 Opacity / RGBA Values

| Value                                  | Usage                                             |
|----------------------------------------|---------------------------------------------------|
| `rgba(255, 255, 255, 0.04)`           | Hero section card bg                               |
| `rgba(255, 255, 255, 0.05)`           | Decorative circles on plan cards                   |
| `rgba(255, 255, 255, 0.1)`            | Hero subtitle pill bg, stats border, banner glow   |
| `rgba(255, 255, 255, 0.12)`           | Hero feature pill bg                               |
| `rgba(255, 255, 255, 0.15)`           | Investment button bg, notification button bg, attachment user card bg, stats container bg, contact user card bg |
| `rgba(255, 255, 255, 0.2)`            | Plan card border, badge bg                         |
| `rgba(255, 255, 255, 0.25)`           | Investment button border, notification button border, banner icon container |
| `rgba(255, 255, 255, 0.3)`            | Badge border                                       |
| `rgba(255, 255, 255, 0.45)`           | Hero section card border                           |
| `rgba(255, 255, 255, 0.7)`            | Total label text, stat label text                  |
| `rgba(255, 255, 255, 0.75)`           | User timestamp in chat                             |
| `rgba(255, 255, 255, 0.8)`            | Monthly info text, hero tagline text               |
| `rgba(255, 255, 255, 0.85)`           | Hero desc, return label text                       |
| `rgba(255, 255, 255, 0.9)`            | Hero subtitle, CTA card desc                       |
| `rgba(0, 0, 0, 0.5)`                  | Modal overlay                                      |
| `rgba(0, 0, 0, 0.06)`                 | Image card border                                  |
| `rgba(0, 0, 0, 0.08)`                 | Contact divider                                    |
| `rgba(0, 0, 0, 0.65)`                 | Image glass overlay bg                             |
| `rgba(40, 66, 196, 0.05)`             | Eye icon bg on login                               |

---

## 2. Typography

### 2.1 Font Families

The app uses platform-specific font families:

| Platform   | Font Families Used                                                                  |
|------------|------------------------------------------------------------------------------------|
| **Android** | `Roboto`, `Roboto-Black`, `Roboto-Bold`, `Roboto-Medium`, `Roboto-Regular`, `sans-serif-light`, `Gilroy-Regular`, `Gilroy-Medium`, `Gilroy-SemiBold`, `Gilroy-Bold`, `Poppins-SemiBold` |
| **iOS**     | `System`, `SF Pro Display`, `SF Pro Text`                                          |
| **Login**   | `DMSans-Regular`                                                                   |

### 2.2 Font Size Scale

| Size (px) | Usage Examples                                                                 |
|-----------|-------------------------------------------------------------------------------|
| `9`       | "NEW" badge text, banner tag, loan badge text                                  |
| `10`      | Status badge text, notification badge text, hero tag text, brand logo gold, verified text, rate label, banner small, contact sub text, disclaimer |
| `11`      | Chat filter tab text, recent label, tab label, plan badge text, total label, monthly info, hero subtitle, hero feature pill text, attachment subtitle, timestamp (chat), image timestamp, unread text, archived count, contact action text, group info type badge text, rating badge |
| `12`      | Card label, error text (login), splash tagline dot, hero subtitle badge, hero tagline, group date, explore subtitle, return label, chit value label, stat label, collection desc, benefit desc, testimonial text, faq answer, FAQ subtitle, contact action text, verified text |
| `13`      | Explore text, investment amount, selector chip text, chat filter text, chat last message, section title (portfolio), feature item description, hero feature pill text, insurance subtitle, collection frequency, chat user list phone, group info start date, benefit title, faq question, loan title, CTA card desc, timestamp (portfolio status) |
| `14`      | Splash tagline text, tab text, group info text, modal message, signup text, feature item title, return label, collection title, testimonial text, insurance button text, progress text, detail label/value, chat name, loading text, user list phone, error message, empty portfolio message, attachment title, contact name, dropdown item text, form label, loanApply text, perm label |
| `15`      | Input text, chat input text, message text, pay button text, explore button text, retry button text, modal button text, chat name, group info member name, form submit text, help fab text, CTA button text, apply button text, expert button text, whisper desc, archived row text, chat screen profile name |
| `16`      | Welcome subtitle text, login btn text, group info text, feature item title, section title (features), portfolio status text, chat name (unread), user list name, modal close text, dropdown item text, form submit text, profile name, avatar text (group info) |
| `17`      | Features section title                                                         |
| `18`      | Avatar text (chat), chit group section title, plan title, whatsapp title, modal title, group card name, portfolio group name |
| `19`      | Card value (portfolio), investment amount                                       |
| `20`      | Stat value, empty portfolio title, section title, modal title, CTA card title, group info modal title |
| `22`      | Greeting title, hero title, section title (finance), header title, insurance title, return amount, chit value amount, plan section title, header component title, admin header title |
| `24`      | Welcome title, empty state text, screen text, group info name, avatar text (chat screen) |
| `25`      | Welcome main text                                                               |
| `28`      | Chit value amount, finance hero subtitle                                        |
| `32`      | Splash brand title, header titles (login, tabs)                                 |
| `36`      | Splash brand logo text, finance hero title                                      |
| `40`      | Pro title                                                                        |

### 2.3 Font Weight Scale

| Weight  | Usage                                                       |
|---------|-------------------------------------------------------------|
| `'400'` | Regular body text, splash brand logo, descriptions, detail values |
| `'500'` | Subtitles, tab labels, timestamps, form text, medium body text |
| `'600'` | Section titles, button text, feature titles, member names, nav text, form labels |
| `'700'` | Headings, card titles, button text, group names, badge text, bold accents |
| `'800'` | Section headers, stat values, plan amounts, hero titles, tag text, greeting title, chit section title |
| `'900'` | Splash brand title, chat header title, finance hero title, pro title, empty state text, CTA titles |

---

## 3. Spacing & Border Radius

### 3.1 Common Padding Values

| Value     | Usage                                                     |
|-----------|-----------------------------------------------------------|
| `4px`     | Button padding, tab container inner padding, small gaps    |
| `8px`     | Small padding, chip padding vertical, gap between elements |
| `10px`    | Tab bar padding top, stats container vertical padding      |
| `12px`    | Card padding, input padding, message list padding, chip horizontal padding |
| `14px`    | Feature item padding vertical, CTA button padding          |
| `16px`    | Section horizontal padding, card inner padding, group card content padding |
| `20px`    | Container padding horizontal, card content padding, group card header padding |
| `24px`    | Content wrapper horizontal padding, login input margin, modal padding |

### 3.2 Border Radius Scale

| Radius      | Usage                                               |
|-------------|-----------------------------------------------------|
| `2px`       | Decorative line                                      |
| `3px`       | Progress bar, dots                                   |
| `4px`       | Chat bubble corner (tight)                           |
| `6px`       | Tab (portfolio), checkbox, skeleton text             |
| `8px`       | Welcome button, dropdown menu, tab container, arrows |
| `10px`      | Attachment icon container, loan badge, archived count |
| `12px`      | Login input roundness, modal button, CTA button, loan apply btn, portfolio pay button, form input, FAQ item |
| `14px`      | Chat item card, archived row, contact card, group info member item, form submit |
| `16px`      | Group cards, chat message bubble, portfolio updated card, image card, modal container, testimonial card, collection card, benefits card |
| `18px`      | Instagram banner image, premium banner                |
| `20px`      | Tab bar top corners, stat card, plan card, features container, chat filter tab, selector chip, hero tag, fab, modal, CTA card |
| `24px`      | Plan section top corners, modal (finance)             |
| `26px`      | Search bar, input wrapper (chat)                      |
| `28px`      | WhatsApp button, empty state button, send button      |
| `30px`      | Tab bar top radius, help FAB                          |
| `42px`      | Plans section top                                     |
| `999px`     | Pill shapes (investment button, badges, insurance button, hero subtitle, notification button, stats container) |

---

## 4. Shadows & Elevation

### 4.1 Shadow Levels

| Level    | `elevation` | `shadowOpacity` | Usage                                       |
|----------|-------------|-----------------|---------------------------------------------|
| **None** | `0`         | `0`             | Plan cards, header (no shadow), chat header  |
| **Subtle** | `1`       | `0.05`          | Message bubbles, chat items, whatsApp items  |
| **Light** | `2`        | `0.05–0.1`      | Input fields, search bars, collection cards, FAQ items, tabs container, chat items |
| **Medium** | `3`       | `0.1`           | Group cards                                  |
| **Strong** | `4`       | `0.2`           | Pay button, retry button, explore button, unread badges, form submit |
| **Elevated** | `5`    | `0.15–0.25`     | Dropdown menus, premium banners              |
| **High** | `6`        | `0.3`           | Custom tab button, CTA buttons, help FAB     |
| **Max** | `8–10`      | `0.15–0.4`      | Login button, tab bar, image shadow, FAB     |

### 4.2 Shadow Colors

| Shadow Color | Usage                                                     |
|-------------|-----------------------------------------------------------|
| `#000000`   | Tab bar shadow, general card shadows, dropdown shadows     |
| `#000`      | Generic shadows on cards, inputs, modals, message bubbles  |
| `#6B46C1`   | Primary purple button shadows (pay, retry, explore, tabs, chat items, search bar, FAB, archived rows) |
| `#7C3AED`   | Stat card shadows, CTA shadow, banners, help FAB, finance CTA |
| `#2842C4`   | Login button shadow, login image shadow                    |
| `#10B981`   | Online indicator shadow                                    |

---

## 5. Status / Semantic Colors

### 5.1 Status Indicator Colors

| Status        | Color       | Icon                | Usage                          |
|---------------|-------------|---------------------|--------------------------------|
| **Active**    | `#10B981`   | `progress-clock`    | Active groups, online status, profile status, verified badge |
| **Completed** | `#6B46C1`   | `check-circle`      | Completed groups               |
| **Pending**   | `#F59E0B`   | `clock-outline`     | Pending groups                 |
| **Overdue**   | `#EF4444`   | `alert-circle`      | Overdue groups, notification badge, remove user button |
| **Paid**      | `#10B981`   | `check-circle`      | Paid status                    |
| **Default**   | `#6B7280`   | `help-circle`       | Unknown/default status         |

### 5.2 Feedback Colors

| Type          | Color       | Usage                                         |
|---------------|-------------|-----------------------------------------------|
| **Success**   | `#059669`   | Collected amount text                          |
| **Success**   | `#10B981`   | Online indicator, verified badge, paid status  |
| **Success Bg**| `#ECFDF5`   | Verified badge background                      |
| **Error**     | `#FF4444`   | Input error text                               |
| **Error**     | `#EF4444`   | Notification badge, remove user button         |
| **Error**     | `#DC2626`   | Error dialog icon                              |
| **Error Bg**  | `#FEE2E2`   | Error icon circle bg                           |
| **Warning**   | `#F59E0B`   | Pending status                                 |

---

## 6. Screen-by-Screen Color Usage

### 6.1 Splash Screen (`SplashStyle.jsx`)

| Element          | Property          | Value                       |
|------------------|-------------------|-----------------------------|
| Container bg     | `backgroundColor` | `#1A0C38` (deepest purple)  |
| Brand title      | `color`           | `#FFFFFF`                   |
| Tagline text     | `color`           | `#FFD54F` (gold)            |
| Tagline dot      | `color`           | `#FFD54F` (gold, 0.8 opacity) |
| Brand logo       | `color`           | `#FFFFFF`                   |
| Brand logo gold  | `color`           | `#FFD54F`                   |

### 6.2 Welcome Screen (`Welcomesty.jsx`)

| Element     | Property          | Value          |
|-------------|-------------------|----------------|
| Container   | `backgroundColor` | `#fff`         |
| Title       | `color`           | `#4A5E6D`      |
| Main text   | `color`           | `black`        |
| Sub text    | `color`           | `black`        |
| Button bg   | `backgroundColor` | `#2842C4`      |
| Button text | `color`           | `white`        |

### 6.3 Login Screen (`Loginsty.jsx`)

| Element            | Property          | Value            |
|--------------------|-------------------|------------------|
| Container bg       | `backgroundColor` | `#FFFFFF`        |
| Heading text       | `color`           | `#1A1A2E`        |
| Subtitle text      | `color`           | `#6B7280`        |
| Decorative line    | `backgroundColor` | `#2842C4`        |
| Input bg           | `backgroundColor` | `#FFFFFF`        |
| Active outline     | `color`           | `#2842C4`        |
| Input icon         | `color`           | `#2842C4`        |
| Error text         | `color`           | `#FF4444`        |
| Login button bg    | `backgroundColor` | `#2842C4`        |
| Login button text  | `color`           | `#FFFFFF`        |
| Link text          | `color`           | `#2842C4`        |
| Modal overlay      | `backgroundColor` | `rgba(0,0,0,0.5)`|
| Modal bg           | `backgroundColor` | `#FFFFFF`        |
| Modal error icon   | `color`           | `#DC2626`        |
| Error icon circle  | `backgroundColor` | `#FEE2E2`        |

### 6.4 Home Screen (`Homesty.jsx`)

| Element                | Property          | Value                        |
|------------------------|--------------------|------------------------------|
| Top container          | `backgroundColor`  | `#411E73`                    |
| Page bg                | `backgroundColor`  | `#FFFFFF`                    |
| Greeting title         | `color`            | `#FFFFFF`                    |
| Hero section card      | `backgroundColor`  | `rgba(255,255,255,0.04)`     |
| Hero title             | `color`            | `#FFFFFF`                    |
| Hero subtitle          | `color`            | `#FDE68A` (gold light)       |
| Stat card bg           | `backgroundColor`  | `#FFFFFF`                    |
| Stat card border       | `borderColor`      | `#F3E8FF`                    |
| Stat card shadow       | `shadowColor`      | `#7C3AED`                    |
| Stat value text        | `color`            | `#6B46C1`                    |
| Stat label text        | `color`            | `#1E293B`                    |
| Plan card bg           | `backgroundColor`  | `#6B46C1`                    |
| Plan title             | `color`            | `#FFFFFF`                    |
| Plan amount            | `color`            | `#FFFFFF`                    |
| Return amount          | `color`            | `#FDE68A`                    |
| Active pagination dot  | `backgroundColor`  | `#7C3AED`                    |
| Inactive dot           | `backgroundColor`  | `#D1D5DB`                    |
| Insurance bg           | `backgroundColor`  | `#E8DEFF`                    |
| Insurance button bg    | `backgroundColor`  | `#2D1654`                    |
| Notification badge     | `backgroundColor`  | `#EF4444`                    |
| Feature icon wrapper   | `backgroundColor`  | `#F5F3FF`                    |
| Features container border | `borderColor`   | `#E5E7EB`                    |
| WhatsApp button text   | `color`            | `#00A884`                    |
| Footer bg              | `backgroundColor`  | `#000000`                    |

### 6.5 Portfolio Screen (`Portfoliosty.jsx`)

| Element              | Property          | Value          |
|----------------------|-------------------|----------------|
| Container bg         | `backgroundColor` | `#FFFFFF`      |
| Active selector chip | `backgroundColor` | `#6B46C1`      |
| Active chip text     | `color`           | `#FFFFFF`      |
| Inactive chip bg     | `backgroundColor` | `#F5F5F5`      |
| Inactive chip text   | `color`           | `#4B5563`      |
| Pay button bg        | `backgroundColor` | `#6B46C1`      |
| Tab bg               | `backgroundColor` | `#F5F5F5`      |
| Active tab bg        | `backgroundColor` | `#FFFFFF`      |
| Active tab text      | `color`           | `#1F2937`      |
| Updated card border  | `borderColor`     | `#EFF2F5`      |

### 6.6 Chat List (`ChatListStyles.jsx`)

| Element              | Property          | Value              |
|----------------------|-------------------|--------------------|
| Container bg         | `backgroundColor` | `#f5f5f5`          |
| Header title         | `color`           | `#1F2937`          |
| Search bar bg        | `backgroundColor` | `#FFFFFF`          |
| Search bar border    | `borderColor`     | `#E9D5FF`          |
| Search bar shadow    | `shadowColor`     | `#6B46C1`          |
| Active filter tab bg | `backgroundColor` | `#7C3AED`          |
| Chat item bg         | `backgroundColor` | `#FFFFFF`          |
| Chat item shadow     | `shadowColor`     | `#6B46C1`          |
| Unread badge bg      | `backgroundColor` | `#6B46C1`          |
| Online indicator     | `backgroundColor` | `#10B981`          |
| FAB bg               | `backgroundColor` | `#6B46C1`          |

### 6.7 Chat Screen (`ChatScreenStyle.jsx`)

| Element               | Property          | Value             |
|-----------------------|-------------------|--------------------|
| Container bg          | `backgroundColor` | `#f5f5f5`         |
| Header bg             | `backgroundColor` | `#FFFFFF`         |
| Header border         | `borderBottomColor` | `#E8D5C4`       |
| User bubble bg        | `backgroundColor` | `#7C3AED`         |
| Other bubble bg       | `backgroundColor` | `#FFFFFF`         |
| User message text     | `color`           | `#FFFFFF`          |
| Other message text    | `color`           | `#1F2937`          |
| Send button bg        | `backgroundColor` | `#7C3AED`          |
| Disabled send btn     | `backgroundColor` | `#C4B5FD`          |
| Profile avatar bg     | `backgroundColor` | `#E9D5FF`          |
| Online status         | `backgroundColor` | `#10B981`          |
| Action button bg      | `backgroundColor` | `#F3F0F7`          |
| Input wrapper border  | `borderColor`     | `#E9D5FF`          |
| Role badge bg         | `backgroundColor` | `#7C3AED`          |

### 6.8 Finance Page (`FinanceStyle.jsx`)

| Element              | Property          | Value              |
|----------------------|-------------------|--------------------|
| Container bg         | `backgroundColor` | `#FAFAFA`          |
| Hero section bg      | `backgroundColor` | `#4C1D95`          |
| Hero gradient 1      | `backgroundColor` | `#8B5CF6`          |
| Hero gradient 2      | `backgroundColor` | `#2E1065`          |
| Hero tag text        | `color`           | `#FBBF24`          |
| CTA button bg        | `backgroundColor` | `#7C3AED`          |
| Premium banner bg    | `backgroundColor` | `#7C3AED`          |
| Help FAB bg          | `backgroundColor` | `#7C3AED`          |
| "NEW" badge bg       | `backgroundColor` | `#EC4899`          |
| Footer bg            | `backgroundColor` | `#000000`          |

### 6.9 Tab Bars (User & Admin)

| Element              | Property          | Value             |
|----------------------|-------------------|--------------------|
| Tab bar bg           | `backgroundColor` | `#FFFFFF`         |
| Tab bar shadow       | `shadowColor`     | `#000000`          |
| Screen container bg  | `backgroundColor` | `#F3F4F6`         |
| Gradient header bg   | `backgroundColor` | `#6B46C1`         |
| Center tab button bg | `backgroundColor` | `#6B46C1`         |
| Center tab shadow    | `shadowColor`     | `#6B46C1`         |
| Alert title          | `color`           | `#6B46C1`         |
| Alert card border    | `borderColor`     | `#EDE9FE`         |
| Join button bg       | `backgroundColor` | `#6B46C1`         |
| Dismiss button bg    | `backgroundColor` | `#F3F4F6`         |

### 6.10 Header Component

| Element          | Property          | Value             |
|------------------|-------------------|--------------------|
| Container bg     | `backgroundColor` | `#FFFFFF`         |
| Title text       | `color`           | `#212121`          |
| Back icon fill   | `fill`            | `#1F2937`          |
| Separator        | `backgroundColor` | `#d7dce4ff`       |

---

## 7. Component Token Reference

### 7.1 Buttons

| Button Type       | Background   | Text Color  | Border Radius | Shadow Color |
|-------------------|-------------|-------------|---------------|--------------|
| Primary (Login)   | `#2842C4`   | `#FFFFFF`   | `16px`        | `#2842C4`    |
| Primary (App)     | `#6B46C1`   | `#FFFFFF`   | `12px`        | `#6B46C1`    |
| CTA / Vivid       | `#7C3AED`   | `#FFFFFF`   | `12–20px`     | `#7C3AED`    |
| Secondary / Ghost | `#F3F4F6`   | `#4B5563`   | `8px`         | none         |
| Danger            | `#EF4444`   | `#FFFFFF`   | `20px`        | none         |
| WhatsApp          | `#FFFFFF`   | `#00A884`   | `28px`        | none         |
| Insurance Dark    | `#2D1654`   | `#FFFFFF`   | `999px`       | `#2D1654`    |

### 7.2 Cards

| Card Type        | Background   | Border Color | Border Radius | Shadow          |
|------------------|-------------|--------------|---------------|-----------------|
| Standard         | `#FFFFFF`   | `#E5E7EB`    | `16px`        | `elevation: 2–3`|
| Plan Card        | `#6B46C1`   | `rgba(255,255,255,0.2)` | `20px` | none        |
| Stat Card        | `#FFFFFF`   | `#F3E8FF`    | `20px`        | `#7C3AED`       |
| Chat Item        | `#FFFFFF`   | none         | `14px`        | `#6B46C1`       |
| Group Card       | `#FFFFFF`   | none         | `16px`        | `#000`          |
| Skeleton Card    | `#F9FAFB`   | `#E5E7EB`    | `16px`        | none            |

### 7.3 Inputs

| Property          | Value                  |
|-------------------|------------------------|
| Background        | `#FFFFFF`              |
| Border (inactive) | `#E0E0E0`              |
| Border (active)   | `#2842C4` or `#E9D5FF` |
| Border radius     | `12px` or `26px`       |
| Text color        | `#1F2937`              |
| Label color       | `#4B5563`              |
| Error color       | `#FF4444`              |
| Icon color        | `#2842C4`              |

### 7.4 Badges

| Badge Type      | Background                     | Text Color | Border Radius |
|-----------------|--------------------------------|------------|---------------|
| Status Active   | `#10B981`                      | `#FFFFFF`  | `12px`        |
| Status Pending  | `#F59E0B`                      | `#FFFFFF`  | `12px`        |
| Status Overdue  | `#EF4444`                      | `#FFFFFF`  | `12px`        |
| Status Completed| `#6B46C1`                      | `#FFFFFF`  | `12px`        |
| Unread          | `#6B46C1`                      | `#FFFFFF`  | `14px`        |
| Plan Badge      | `rgba(255,255,255,0.2)`        | `#FFFFFF`  | `999px`       |
| "NEW" Badge     | `#EC4899`                      | `#FFFFFF`  | `12px`        |
| Type Badge      | `#F3E8FF`                      | `#7C3AED`  | `12px`        |
| Role Badge      | `#7C3AED`                      | `#FFFFFF`  | `6px`         |
| Notification    | `#EF4444`                      | `#FFFFFF`  | `8px`         |
| Verified        | `#ECFDF5`                      | `#10B981`  | `8px`         |
| Rating          | `#FEF3C7`                      | `#92400E`  | `12px`        |
| Archived Count  | `#F3E8FF`                      | `#6B46C1`  | `10px`        |
| Permission      | `#ECE9FE`                      | `#6B46C1`  | `8px`         |

### 7.5 Modals

| Property          | Value                           |
|-------------------|---------------------------------|
| Overlay bg        | `rgba(0, 0, 0, 0.5)`           |
| Modal bg          | `#FFFFFF`                       |
| Border radius     | `16–24px`                       |
| Title color       | `#111827` or `#1F2937`          |
| Message color     | `#4B5563`                       |
| Button bg         | `#2842C4` (login) / `#7C3AED` (app) |
| Button text       | `#FFFFFF`                       |

### 7.6 Navigation / Tab Bar

| Property                  | Value                   |
|---------------------------|-------------------------|
| Tab bar bg                | `#FFFFFF`               |
| Tab bar radius (top)      | `30px`                  |
| Tab bar height (Android)  | `70px`                  |
| Tab bar height (iOS)      | `90px`                  |
| Active tab icon color     | `#6B46C1`               |
| Inactive tab icon color   | `#9CA3AF`               |
| Tab label size            | `11px`                  |
| Center FAB bg             | `#6B46C1`               |
| Center FAB size           | `52×52px`               |

---

## 8. Design Patterns & Conventions

### 8.1 Light Mode Only

The app currently operates in **light mode only**. All backgrounds default to `#FFFFFF` or light grays (`#F5F5F5`, `#F3F4F6`, `#FAFAFA`, `#f5f5f5`). The `ThemeProvider` is commented out in `App.jsx`.

### 8.2 Gradient Simulation

Since React Native `StyleSheet` doesn't support CSS gradients, the app uses:
- **Overlapping circles** with `position: absolute` and `borderRadius` to simulate gradients (Finance hero, plan cards)
- **Multiple background layers** with RGBA values
- **Lottie animations** for decorative elements

### 8.3 Platform-Specific Styling

```jsx
fontFamily: Platform.OS === 'android' ? 'Gilroy-Bold' : 'System'
paddingTop: Platform.OS === 'ios' ? 50 : 30
height: Platform.OS === 'ios' ? 90 : 70
```

### 8.4 Card Design System

All cards follow a consistent pattern:
- **White background** (`#FFFFFF`)
- **Light border** (`#E5E7EB`, `#F3E8FF`, or `#EFF2F5`)
- **Rounded corners** (`12–20px`)
- **Subtle shadow** (`elevation: 2–3`, `shadowOpacity: 0.05–0.1`)
- **Internal padding** (`16–20px`)

### 8.5 Color Hierarchy

```
Headers / Hero Areas    → Deep Purple (#411E73, #4C1D95, #1A0C38)
Primary Actions         → Brand Purple (#6B46C1)
Interactive Highlights  → Vivid Purple (#7C3AED)
Body Content            → Dark Grays (#1F2937, #1E293B)
Secondary Text          → Medium Grays (#6B7280, #4B5563)
Muted / Timestamps      → Light Grays (#9CA3AF)
Backgrounds             → White/Near-White (#FFFFFF, #F5F5F5, #F3F4F6)
Gold Accents            → Warm Gold (#FFD54F, #FDE68A, #FBBF24)
```

### 8.6 Icon System

- **Icon Library**: `react-native-vector-icons/MaterialCommunityIcons`
- **Custom SVG Icons**: Stored in `src/assets/` (login icons, splash assets, finance icons, left-arrow)
- **Icon Sizes**: `12px` (badges), `16px` (inline), `20px` (buttons), `24px` (navigation), `36px` (dialog)

### 8.7 Animation Constants

| Animation Property       | Value          |
|--------------------------|----------------|
| Fade duration            | `800ms`        |
| Slide duration           | `600ms`        |
| Spring tension           | `50`           |
| Spring friction          | `7`            |
| Mandala opacity          | `0.08–0.09`    |

### 8.8 Styling File Naming Convention

| Pattern             | Example                  |
|---------------------|--------------------------|
| `*sty.jsx`          | `Homesty.jsx`, `Loginsty.jsx`, `Welcomesty.jsx`, `Portfoliosty.jsx` |
| `*Style.jsx`        | `SplashStyle.jsx`, `ChatScreenStyle.jsx`, `FinanceStyle.jsx` |
| `*Styles.jsx`       | `ChatListStyles.jsx`     |
| Inline in component | `GroupCard.jsx`, `Header.jsx` |

---

> **Note**: Since there is no centralized theme file, all colors are hard-coded in individual style files. To refactor, consider creating a `src/theme/colors.js` constants file and importing it across all style sheets.


---

## 9. Project Directory & Folder Structure

### 9.1 High-Level Architecture Overview

| Directory / Layer | Purpose |
| :--- | :--- |
| **`android/`** | Native Android project configuration, Gradle files, native modules (`ContactPickerModule.kt`), and manifests. |
| **`ios/`** | Native iOS Xcode workspace, `AppDelegate.swift`, plist, and CocoaPods specs. |
| **`src/animation/`** | Lottie vector animation JSON files for loaders, graph illustrations, and user journey steps. |
| **`src/assets/`** | Static assets categorized into Finance illustrations, SVG icons, Login vectors, and Splash art. |
| **`src/components/`** | Core shared UI widgets: Navigation bar (`Tab`), Header, Auction Modals, Routing, and Cards. |
| **`src/config/`** | App configuration parameters such as geolocation and API settings. |
| **`src/pages/Admin/`** | Admin panel screens: Dashboard, User/Group Management, Live Auctions, Reports, and System Settings. |
| **`src/pages/Fronter/`** | Authentication and onboarding flow: Splash, Welcome, and Login screens. |
| **`src/pages/User/`** | User-facing application screens: Home, Portfolio, Chat, Chit Groups, and User Profile. |
| **`src/services/`** | Networking layer: Axios/REST API client, WebSockets (real-time auctions), Biometrics, and Geolocation. |
| **`src/store/`** | Global state stores (Zustand) such as language preference. |
| **`src/utils/`** | React Contexts (AuthContext, AuctionContext, LanguageContext), encryption utilities, and navigation helpers. |

---

### 9.2 Complete Folder & File Tree

```text
GDKChit/
├── __tests__/
│   └── App.test.tsx
├── .vscode/
│   ├── settings.json
│   └── tasks.json
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── java/
│   │   │       │   └── com/
│   │   │       │       └── gdkchit/
│   │   │       │           ├── ContactPickerModule.kt
│   │   │       │           ├── ContactPickerPackage.kt
│   │   │       │           ├── MainActivity.kt
│   │   │       │           └── MainApplication.kt
│   │   │       ├── res/
│   │   │       │   ├── drawable/
│   │   │       │   │   └── rn_edit_text_material.xml
│   │   │       │   ├── Fonts/
│   │   │       │   ├── mipmap-hdpi/
│   │   │       │   │   ├── ic_launcher_round.png
│   │   │       │   │   └── ic_launcher.png
│   │   │       │   ├── mipmap-mdpi/
│   │   │       │   │   ├── ic_launcher_round.png
│   │   │       │   │   └── ic_launcher.png
│   │   │       │   ├── mipmap-xhdpi/
│   │   │       │   │   ├── ic_launcher_round.png
│   │   │       │   │   └── ic_launcher.png
│   │   │       │   ├── mipmap-xxhdpi/
│   │   │       │   │   ├── ic_launcher_round.png
│   │   │       │   │   └── ic_launcher.png
│   │   │       │   ├── mipmap-xxxhdpi/
│   │   │       │   │   ├── ic_launcher_round.png
│   │   │       │   │   └── ic_launcher.png
│   │   │       │   └── values/
│   │   │       │       ├── strings.xml
│   │   │       │       └── styles.xml
│   │   │       └── AndroidManifest.xml
│   │   ├── build.gradle
│   │   ├── debug.keystore
│   │   └── proguard-rules.pro
│   ├── gradle/
│   │   └── wrapper/
│   │       ├── gradle-wrapper.jar
│   │       └── gradle-wrapper.properties
│   ├── build.gradle
│   ├── gradle.properties
│   ├── gradlew
│   ├── gradlew.bat
│   └── settings.gradle
├── ios/
│   ├── GDKChit/
│   │   ├── Images.xcassets/
│   │   │   ├── AppIcon.appiconset/
│   │   │   │   └── Contents.json
│   │   │   └── Contents.json
│   │   ├── AppDelegate.swift
│   │   ├── Info.plist
│   │   ├── LaunchScreen.storyboard
│   │   └── PrivacyInfo.xcprivacy
│   ├── GDKChit.xcodeproj/
│   │   ├── xcshareddata/
│   │   │   └── xcschemes/
│   │   │       └── GDKChit.xcscheme
│   │   └── project.pbxproj
│   ├── .xcode.env
│   └── Podfile
├── src/
│   ├── animation/
│   │   ├── UserHome/
│   │   │   ├── 1LAkhLotte.json
│   │   │   ├── 2LakhLotte.json
│   │   │   ├── 3LakhLotte.json
│   │   │   ├── 5LakhLotte.json
│   │   │   └── MoneyIncreaseGraph.json
│   │   ├── Add-user.json
│   │   ├── contact_us.json
│   │   ├── Customer_care.json
│   │   ├── data-export.json
│   │   ├── Finance.json
│   │   ├── join a group.json
│   │   ├── language.json
│   │   ├── Lock_Authentication.1.json
│   │   ├── Maintenance web.json
│   │   ├── MoneyLending.json
│   │   ├── Navigate_House_Address.json
│   │   ├── OTP-Verification.json
│   │   ├── Revenue.json
│   │   └── Share_Location.json
│   ├── assets/
│   │   ├── Finance/
│   │   │   ├── approval-finance.png
│   │   │   ├── papperwork-finance.jpeg
│   │   │   ├── personal-finance.png
│   │   │   ├── secure-finance.png
│   │   │   ├── shop-finance.png
│   │   │   └── support-finance.jpeg
│   │   ├── Icon/
│   │   │   ├── comments.svg
│   │   │   ├── home.svg
│   │   │   ├── left-arrow.svg
│   │   │   ├── plus.svg
│   │   │   ├── Portfolio.svg
│   │   │   ├── right-view.svg
│   │   │   └── user.svg
│   │   ├── login/
│   │   │   ├── eye-slash-svgrepo-com.svg
│   │   │   ├── eye-svgrepo-com.svg
│   │   │   ├── google.svg
│   │   │   ├── loginimg.svg
│   │   │   ├── separator.svg
│   │   │   ├── tick.svg
│   │   │   └── tickbox.svg
│   │   ├── splash/
│   │   │   ├── RangoliOriginal.jpeg
│   │   │   ├── RangoliPurple.jpeg
│   │   │   └── RangoliWhite.jpeg
│   │   └── UserHomePage/
│   │       ├── ActiveMembers.png
│   │       ├── banklocker.png
│   │       ├── Biometric.png
│   │       ├── DuelLanguage.png
│   │       ├── FundManagement.png
│   │       ├── gold_graph_banner.png
│   │       ├── gold_ripped_banner.png
│   │       ├── gold_rupee_banner.png
│   │       ├── GoldenRangoli.png
│   │       ├── Location.png
│   │       ├── OnlineTransation.png
│   │       ├── PlansBG.jpeg
│   │       ├── PurpleImage.jpg
│   │       ├── rangoli.png
│   │       ├── trust.png
│   │       ├── YearsLegacy.png
│   │       ├── ZoomGoldenRangoli.png
│   │       └── ZoomRangoli.png
│   ├── components/
│   │   ├── AnimationDebugger/
│   │   │   └── AnimationDebugPanel.jsx
│   │   ├── GlobalAuctionModal/
│   │   │   └── GlobalAuctionModal.jsx
│   │   ├── GroupCard/
│   │   │   └── GroupCard.jsx
│   │   ├── HeaderComponent/
│   │   │   └── Header.jsx
│   │   ├── OTPNotificationBanner/
│   │   │   └── OTPNotificationBanner.jsx
│   │   ├── Routes/
│   │   │   └── Routes.jsx
│   │   └── Tab/
│   │       ├── ATab/
│   │       │   ├── AdminTab.jsx
│   │       │   └── AdminTabsty.jsx
│   │       ├── UTab/
│   │       │   ├── UserTab.jsx
│   │       │   └── UserTabsty.jsx
│   │       └── TabRouter.jsx
│   ├── config/
│   │   └── locationConfig.js
│   ├── pages/
│   │   ├── Admin/
│   │   │   ├── Modals/
│   │   │   │   ├── page/
│   │   │   │   │   ├── AddUser/
│   │   │   │   │   │   ├── AddU.jsx
│   │   │   │   │   │   └── AddUsty.jsx
│   │   │   │   │   ├── CreateGroup/
│   │   │   │   │   │   ├── CreateG.jsx
│   │   │   │   │   │   └── createGsty.jsx
│   │   │   │   │   ├── ManageGroups/
│   │   │   │   │   │   ├── GroupManagement/
│   │   │   │   │   │   │   ├── Modal/
│   │   │   │   │   │   │   │   ├── AuctionW.jsx
│   │   │   │   │   │   │   │   ├── EditModal.jsx
│   │   │   │   │   │   │   │   └── PaymentD.jsx
│   │   │   │   │   │   │   ├── Page/
│   │   │   │   │   │   │   │   └── MemberRegistration.jsx
│   │   │   │   │   │   │   └── GroupInfo.jsx
│   │   │   │   │   │   ├── ManageG.jsx
│   │   │   │   │   │   └── ManageGsty.jsx
│   │   │   │   │   └── ManageUser/
│   │   │   │   │       └── ManageU.jsx
│   │   │   │   └── more.jsx
│   │   │   └── pages/
│   │   │       ├── Chat/
│   │   │       │   ├── ChatList/
│   │   │       │   │   ├── ChatList.jsx
│   │   │       │   │   └── ChatListStyles.jsx
│   │   │       │   ├── ChatScreen/
│   │   │       │   │   ├── ChatScreen.jsx
│   │   │       │   │   └── ChatScreenStyle.jsx
│   │   │       │   └── NewGroup/
│   │   │       │       ├── NewGroup.jsx
│   │   │       │       ├── NewGroupDetails.jsx
│   │   │       │       └── NewGroupStyles.jsx
│   │   │       ├── Dashboard/
│   │   │       │   ├── Dashboard.jsx
│   │   │       │   └── DashboardStyles.jsx
│   │   │       ├── Notification/
│   │   │       │   ├── Notification.jsx
│   │   │       │   └── NotificationStyles.js
│   │   │       ├── Reports/
│   │   │       │   ├── pages/
│   │   │       │   │   ├── MemberChitCard/
│   │   │       │   │   │   ├── MemberChitCard.jsx
│   │   │       │   │   │   └── MemberChitCardSty.jsx
│   │   │       │   │   ├── MemberDetails/
│   │   │       │   │   │   ├── MemberDetails.jsx
│   │   │       │   │   │   └── MemberDetailsStyles.jsx
│   │   │       │   │   └── PaymentEditiorModal/
│   │   │       │   │       ├── PaymentStatusEditior.jsx
│   │   │       │   │       └── PaymentStatusEditorStyles.jsx
│   │   │       │   ├── Reports.jsx
│   │   │       │   └── ReportsStyles.jsx
│   │   │       └── Settings/
│   │   │           ├── Model/
│   │   │           │   ├── RateApp/
│   │   │           │   │   └── Rate.jsx
│   │   │           │   └── ShareApp/
│   │   │           │       └── Share.jsx
│   │   │           ├── pages/
│   │   │           │   ├── AccountDetails/
│   │   │           │   │   └── EditProfile.jsx
│   │   │           │   ├── Auction/
│   │   │           │   │   ├── Betting-Auction/
│   │   │           │   │   │   └── BettingAuction.jsx
│   │   │           │   │   ├── MemberSelecting/
│   │   │           │   │   │   └── MemberSelectingModal.jsx
│   │   │           │   │   ├── Random-Auction/
│   │   │           │   │   │   └── RandomAuction.jsx
│   │   │           │   │   ├── Auction.jsx
│   │   │           │   │   └── AuctionSty.jsx
│   │   │           │   ├── BlockUser/
│   │   │           │   │   └── BlockUser.jsx
│   │   │           │   ├── DataExport/
│   │   │           │   │   └── DataExport.jsx
│   │   │           │   ├── LanguageSettings/
│   │   │           │   │   └── LanguageSettings.jsx
│   │   │           │   ├── MyLocation/
│   │   │           │   │   ├── Share_info_modal/
│   │   │           │   │   │   └── ShareLocationInfo.jsx
│   │   │           │   │   └── MyLocation.jsx
│   │   │           │   ├── OTPRequests/
│   │   │           │   │   └── OTPRequests.jsx
│   │   │           │   ├── PasswordManagement/
│   │   │           │   │   └── PasswordManagement.jsx
│   │   │           │   ├── SecurityLock/
│   │   │           │   │   ├── Lock-Info-Modal/
│   │   │           │   │   │   └── LockInfo.jsx
│   │   │           │   │   ├── SecurityLockScreen.jsx
│   │   │           │   │   └── SecurityPermision.jsx
│   │   │           │   └── UserLocation/
│   │   │           │       └── UserL.jsx
│   │   │           └── setting.jsx
│   │   ├── Fronter/
│   │   │   ├── Login/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Loginsty.jsx
│   │   │   ├── Splash/
│   │   │   │   ├── Splash.jsx
│   │   │   │   └── SplashStyle.jsx
│   │   │   └── Welcome/
│   │   │       ├── Welcome.jsx
│   │   │       └── Welcomesty.jsx
│   │   └── User/
│   │       ├── manual/
│   │       │   ├── usermanule.jsx
│   │       │   └── usermanulesty.js
│   │       ├── Modals/
│   │       │   ├── Pages/
│   │       │   │   ├── Auction/
│   │       │   │   │   ├── BettingAuction/
│   │       │   │   │   │   └── BettingAuction.jsx
│   │       │   │   │   ├── RandomAuction/
│   │       │   │   │   │   └── RandomAuction.jsx
│   │       │   │   │   └── Auction.jsx
│   │       │   │   ├── ChitGroupCard/
│   │       │   │   │   ├── ChitCard.jsx
│   │       │   │   │   └── GroupCards.jsx
│   │       │   │   ├── Finance/
│   │       │   │   │   ├── Finance.jsx
│   │       │   │   │   └── FinanceStyle.jsx
│   │       │   │   └── JoinGroup/
│   │       │   │       └── JoinGroup.jsx
│   │       │   └── More.jsx
│   │       └── Pages/
│   │           ├── Chat/
│   │           │   ├── ChatList/
│   │           │   │   ├── ChatList.jsx
│   │           │   │   └── ChatListStyles.jsx
│   │           │   └── ChatScreen/
│   │           │       ├── ChatScreen.jsx
│   │           │       └── ChatScreenStyle.jsx
│   │           ├── Home/
│   │           │   ├── Chit Plans/
│   │           │   │   └── ChitPlans.jsx
│   │           │   ├── Home.jsx
│   │           │   └── Homesty.jsx
│   │           ├── Portfolio/
│   │           │   ├── GroupCardInfo/
│   │           │   │   ├── GroupCardInfo.jsx
│   │           │   │   └── GroupCardInfoSty.jsx
│   │           │   ├── Portfolio.jsx
│   │           │   └── Portfoliosty.jsx
│   │           └── Profile/
│   │               ├── Modals/
│   │               │   ├── Rate.jsx
│   │               │   └── Share.jsx
│   │               ├── Page/
│   │               │   ├── AdminLocation/
│   │               │   │   └── AdminLocation.jsx
│   │               │   ├── HelpAndSupport/
│   │               │   │   └── Help&Support.jsx
│   │               │   ├── LanguageSettings/
│   │               │   │   └── LanguageSettings.jsx
│   │               │   ├── LinkBankAccount/
│   │               │   │   └── LinkBankAccount.jsx
│   │               │   ├── MyLocation/
│   │               │   │   ├── Share_info_modal/
│   │               │   │   │   └── ShareLocationInfo.jsx
│   │               │   │   └── MyLocation.jsx
│   │               │   ├── OTPRequests/
│   │               │   │   └── OTPRequests.jsx
│   │               │   ├── PrivacyPolicy/
│   │               │   │   └── PrivacyPolicy.jsx
│   │               │   ├── SecurityLock/
│   │               │   │   ├── Lock-Info-Modal/
│   │               │   │   │   └── LockInfo.jsx
│   │               │   │   ├── SecurityLockScreen.jsx
│   │               │   │   └── SecurityPermision.jsx
│   │               │   ├── UserAccountDetails/
│   │               │   │   └── AccountDetails.jsx
│   │               │   ├── UserNominee/
│   │               │   │   └── Nominee.jsx
│   │               │   └── Verification/
│   │               │       └── IdentityVerification.jsx
│   │               └── Profile.jsx
│   ├── services/
│   │   ├── ApiService.js
│   │   ├── AuctionWebSocketService.js
│   │   ├── BiometricService.js
│   │   └── locationService.js
│   ├── store/
│   │   └── useLanguageStore.js
│   └── utils/
│       ├── translations/
│       │   ├── index.js
│       │   └── ta.js
│       ├── AuctionContext.jsx
│       ├── AuthContext.js
│       ├── authLoader.js
│       ├── encryptPassword.jsx
│       ├── env.js
│       ├── LanguageContext.js
│       └── navigation.js
├── .eslintrc.js
├── .gitignore
├── .npmrc
├── .prettierrc.js
├── .watchmanconfig
├── app.json
├── App.jsx
├── babel.config.js
├── Gemfile
├── index.js
├── jest.config.js
├── metro.config.js
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```
