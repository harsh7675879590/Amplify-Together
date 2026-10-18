# Amplify Together — Official Submission Deliverables

[![Platform](https://img.shields.io/badge/Platform-React%20Native%20%7C%20Expo%20SDK%2058-blue.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](https://www.typescriptlang.org/)
[![Build](https://img.shields.io/badge/Build-EAS%20Build%20Ready-success.svg)](https://expo.dev/eas)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Important Disclosure & Product Philosophy:**  
> **Amplify Together is NOT a donation platform.** Contributions strictly fund the *advertising and distribution cost* of important civic, scientific, and community messages. It does not fund creators, causes, or organizations directly. The words *"donate"* or *"donation"* are strictly forbidden across all copy and user interfaces.

---

## 📑 Submission Contents

1. [Part 1: Demo Video Walkthrough](#1-demo-video-walkthrough)
   - [Video Artifact Locations](#video-artifact-locations)
   - [Minute-by-Minute Presentation Script](#minute-by-minute-presentation-script)
   - [Interactive Web Preview Instructions](#interactive-web-preview-instructions)
2. [Part 2: App Build Submissions](#2-app-build-submissions)
   - [Android APK Build Guide](#android-apk-build)
   - [iOS TestFlight Release Guide](#ios-testflight-build)
3. [Part 3: Complete Feature Matrix & Compliance Audit](#3-complete-feature-matrix--compliance-audit)

---

## 1. Demo Video Walkthrough

A complete, high-definition end-to-end video walkthrough has been recorded, capturing every core user flow and design interaction within the native mobile container (400×850 mobile viewport).

### 🎬 Master MP4 Demo Video File

The complete submission demo video has been encoded into a standard H.264 MP4 file:

- **File Name:** `demo_video.mp4`
- **Location:** [demo_video.mp4](file:///c:/Users/harsh/OneDrive/Desktop/Amplify%20Together/demo_video.mp4) (Root directory of the project)
- **Format:** H.264 / YUV420p (Compatible with all media players, VLC, QuickTime, YouTube, and mobile devices)
- **Resolution:** 1920 × 958 (HD High-DPI Capture)
- **Duration:** 1 minute 56 seconds (1,161 frames)
- **File Size:** ~5.75 MB

---

### Video Artifact Locations (WebP Sessions)

In addition to `demo_video.mp4`, full-motion recordings from each phase are saved directly in the artifacts directory:

| Recording | Scope | Description |
|---|---|---|
| **Master Walkthrough** | Complete Lifecycle | Full end-to-end user journey across Home, Explore, Detail, Backing, Creation, Dashboard, Activity, and Profile |
| **Home & Explore Flow** | Discovery | Hero with live reach calculation formula, featured carousel, 10-category filters, debounced search, 4-way sort, and filter bottom sheet |
| **Campaign Detail Flow** | Editorial Reading | High-trust editorial layout, Georgia serif story blocks, inline captioned images, stat callouts, primary source citations, and Use of Funds accordions |
| **Backing & Settlement Flow** | Financial Backing | 5-step backing stack, preset amounts, fee itemization, anti-donation checkbox, simulated checkout (*4242, *0002, *0001), and viewable receipt modal |
| **Campaign Creation Flow** | Creator Tooling | Voice assistant transcript demo, 5-step wizard, live reader preview toggle, ad placement previews (Feed, Story, Banner), and 6-stage lifecycle timeline |
| **Creator Dashboard Flow** | Analytics & Moderation | 6-tab lifecycle management, strictly separated Estimated vs. Measured reach delivery metrics, and Reviewer Mode demo advancement |

*Note: The WebP video files can be played natively in Google Chrome, Microsoft Edge, Safari, or embedded directly into markdown.*

---

### Minute-by-Minute Presentation Script

If presenting or recording a live commentary over the walkthrough, follow this timestamped script:

#### **[0:00 – 0:45] Introduction & Home Discovery**
- **What to show:** Open the app on the Home tab. Point out the editorial typography, Georgia serif headline, and the prominent value proposition: *"Amplify Together pools funds toward advertising costs to deliver important messages beyond your echo chamber."*
- **What to say:** *"Welcome to Amplify Together. This is a community-funded advertising platform designed to help critical scientific, public policy, and civic messages escape algorithmic echo chambers. Unlike traditional crowdfunding, this is strictly NOT a donation platform—every dollar pools toward verified advertising inventory to expand audience reach."*
- **Interaction:** Highlight the live Reach Calculation card: `"$10 could reach about 840–1,560 people"` with the mandatory disclosure: `"Estimate, not a guarantee"`. Scroll through the horizontal Featured Carousel and the 3-step lifecycle card (*Create ➔ Review ➔ Amplify*).

#### **[0:45 – 1:30] Explore, Search & Category Filters**
- **What to show:** Tap the Explore tab in the bottom bar. Tap category chips (*Environment*, *Health*, *Science*, *Education*). Type `"Clean"` into the search bar. Open the Filter Bottom Sheet.
- **What to say:** *"The Explore screen allows backers to discover verified campaigns across 10 distinct categories. Searches are debounced for maximum responsiveness. Backers can filter by category, funding status, or minimum completion threshold, and sort by 'Closest to goal' or 'Ending soon' to support urgent initiatives."*

#### **[1:30 – 2:30] Editorial Campaign Detail & Verified Sources**
- **What to show:** Select the featured campaign *"Clean drinking water in every public school"*. Scroll through the editorial story blocks. Point out the stat callout (*15 ppb*), captioned image with photographer credit, and the verified Sources list with EPA links.
- **What to say:** *"The Campaign Detail screen provides a calm, long-form editorial reading experience inspired by The Atlantic. Crucially, every claim must cite primary sources—such as government health records or scientific journals—which are visible and directly accessible to all readers. At the bottom, our 'Use of Funds' accordion transparently explains our 5% platform fee, advertising inventory allocation, and strict anti-donation policy."*

#### **[2:30 – 3:45] Backing Flow & Simulated Checkout**
- **What to show:** Tap `"Back This Campaign"` on the sticky bottom bar. Select `$50`. Review the itemized fee table. Check the required anti-donation acknowledgment. Select test card `•••• 4242`. Authorize the budget. View the success screen and tap `"View Detailed Receipt"`.
- **What to say:** *"Backing a campaign is designed for complete trust. In Step 1, backers choose an amount—or type a custom value—and watch the estimated reach update live. Step 2 presents a transparent itemization of platform fees (5%) and card processing fees (2.9% + $0.30), accompanied by a mandatory acknowledgment that this funds distribution, not direct charity. In Step 3, our simulated checkout supports test cards 4242 for immediate success, 0002 for declined card testing, and 0001 for pending settlement. Once authorized, backers can view and download an itemized receipt."*

#### **[3:45 – 4:45] 5-Step Campaign Creation Wizard & Voice Assistant**
- **What to show:** Tap the Create tab. Tap `"Create with Your Voice"`. Insert the canned transcript demo and click `"Generate Editable Draft"`. Walk through Step 1 (Basics), Step 2 (Story reordering & Live Reader Preview), Step 3 (Feed/Story/Banner ad previews), Step 4 (Reach & Budget), and Step 5 (Submit).
- **What to say:** *"Creators can draft campaigns manually or use our Speech-to-Text Voice Assistant. Here, our AI parser structures the transcript into a complete draft with headlines, story blocks, and ad creatives. Notice that all fields remain 100% editable, and the funding goal is strictly never generated by AI—creators must manually enter their target ad budget in Step 4. Step 2 also includes a Live Reader Preview toggle so creators see exactly how their story will appear to backers."*

#### **[4:45 – 5:30] Creator Dashboard & Audited Delivery Analytics**
- **What to show:** Navigate to the Creator Dashboard (`/dashboard`). Switch through tabs (*Drafts*, *Under Review*, *Published/Funding*, *Promoting*, *Completed*). Open the `"Campaign Analytics"` modal.
- **What to say:** *"The Creator Dashboard tracks campaign health across all 6 lifecycle stages. Our Campaign Analytics modal enforces strict separation between Estimated Reach projections and Measured Reach delivery, itemizing ad impressions, clicks, click-through rate, effective CPM, and verified delivery channels across social feeds and local news publishers."*

#### **[5:30 – 6:00] Reviewer Mode & Verification**
- **What to show:** Go to Profile tab. Toggle `"Reviewer Mode"`. Open the Review Queue to demonstrate how campaigns are audited, approved, and transitioned to public funding.
- **What to say:** *"For hackathon evaluation, our Profile tab features a built-in Reviewer Mode toggle. This allows judges to inspect the moderation queue, verify citations, and advance campaigns through each stage of the lifecycle. Amplify Together provides the complete infrastructure to turn important ideas into high-impact public advertising campaigns."*

---

### Interactive Web Preview Instructions

To run the application locally and test all interactions directly in your browser:

```bash
# 1. Navigate to the mobile project directory
cd mobile

# 2. Start the Expo development server
npm run web

# 3. Open in your browser:
# http://localhost:8081
```

To test on physical iOS or Android devices:
```bash
# Start Metro bundler with QR code
npx expo start

# Scan the QR code using the Expo Go app (iOS Camera or Android Expo Go)
```

---

## 2. App Build Submissions

### Android APK Build

Amplify Together is fully configured with **Expo Application Services (EAS Build)** to produce direct, standalone Android `.apk` files that can be installed on any Android smartphone without requiring Google Play Store submission.

#### Configuration in `mobile/eas.json`:
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

#### Steps to Generate the Android APK via EAS Cloud:

1. **Install EAS CLI & Log In:**
   ```bash
   cd mobile
   npx eas-cli login
   ```
   *(Create a free Expo account at [expo.dev](https://expo.dev) if you don't already have one).*

2. **Trigger the Standalone APK Build:**
   ```bash
   npx eas-cli build -p android --profile preview
   ```

3. **Download & Install:**
   - EAS will run the build in the cloud and output a direct download URL and QR code in your terminal.
   - Example download URL: `https://expo.dev/artifacts/eas/.../build.apk`
   - Open the link on any Android device, tap **Download**, and install the APK.

#### Alternative: Building the APK Locally with Android Studio / Gradle:
If you have the Android SDK and Java installed locally:
```bash
cd mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# Output APK will be located at:
# mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

### iOS TestFlight Build

For iOS devices, Apple requires code signing and provisioning through an Apple Developer Account. The project is pre-configured for automated archive creation and TestFlight deployment via EAS Build.

#### Configuration in `mobile/eas.json`:
```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### Steps to Generate and Submit to iOS TestFlight:

1. **Prerequisites:**
   - An active Apple Developer Account ($99/year) with an Apple Team ID.
   - Bundle Identifier: `com.amplifytogether.app` (configured in `mobile/app.json`).

2. **Trigger the TestFlight Build & Automatic Submission:**
   ```bash
   cd mobile
   npx eas-cli build -p ios --profile production --auto-submit
   ```
   - EAS Build will automatically generate Apple distribution certificates, build the IPA archive, and upload it directly to **App Store Connect**.

3. **Distribute to Testers in TestFlight:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com/) ➔ **Apps** ➔ **Amplify Together** ➔ **TestFlight**.
   - Under **Internal Testing**, add your team members for instant access (no Apple review required).
   - Under **External Testing**, create a public TestFlight link to share with judges and external evaluators.

#### Alternative: Testing on iOS without Apple Developer Account:
- Use **Expo Go**:
  ```bash
  cd mobile
  npx expo start
  ```
  Scan the QR code with the native iOS Camera app to run the complete native application inside Expo Go on any iPhone or iPad.

---

## 3. Complete Feature Matrix & Compliance Audit

| Requirement | Implementation Details | Status |
|---|---|---|
| **Anti-Donation Compliance** | Zero forbidden words (*donate*, *donation*). 100% of copy emphasizes message distribution and advertising reach. Mandatory backer acknowledgment checkbox. | ✅ Verified |
| **Design System & Typography** | Georgia serif editorial headlines, clean sans-serif UI, 8pt spatial grid, accessible contrast ratios, and touch targets $\ge 44\text{px}$. | ✅ Verified |
| **Algorithmic Reach Modeler** | 120 reach per dollar base with uncertainty bands ($[0.7 \times R, 1.3 \times R]$). Live updating across backing presets and creator budget inputs. | ✅ Verified |
| **Transparent Fee Engine** | 5% platform fee + $2.9\% + \$0.30$ processing fee transparently calculated and displayed on review and receipts. | ✅ Verified |
| **Simulated Payment Gateway** | Guest checkout with test cards `4242` (succeeded), `0002` (declined), and `0001` (pending). Downloadable/viewable receipt modal. | ✅ Verified |
| **5-Step Creator Wizard** | Basics, Story with block reordering & live reader preview, Ad Visuals with 3 placement formats, Reach targeting, and manual goal entry. | ✅ Verified |
| **AI Voice Assistant Demo** | Speech-to-text recording simulation with canned transcript generator, populating an 100% editable draft banner. | ✅ Verified |
| **Audited Post-Campaign Delivery** | Creator Dashboard with separated Estimated vs. Measured reach metrics, impressions, clicks, CTR, CPM, and channel breakdowns. | ✅ Verified |
| **Reviewer Mode Switch** | Demo control in Profile tab enabling judges to audit the queue and transition campaigns across all 6 lifecycle stages. | ✅ Verified |
| **Static Legal & Info Pages** | `/info/[page]` editorial template supporting About, How It Works, FAQs with Accordion, Help, Contact, Terms, and Privacy. | ✅ Verified |

---

## 🤝 Project Submission Sign-Off

- **Repository:** `https://github.com/harsh7675879590/Amplify-Together.git`
- **Branch:** `master`
- **Application Bundle ID:** `com.amplifytogether.app`
- **Expo SDK Version:** `58.0.14`
- **Status:** **Ready for Hackathon Judging & Evaluation**
