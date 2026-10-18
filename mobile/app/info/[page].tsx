import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../../components/Header";
import { Accordion } from "../../components/Accordion";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

interface InfoContent {
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
  faqs?: { question: string; answer: string }[];
}

const PAGE_DATA: Record<string, InfoContent> = {
  about: {
    title: "About Amplify Together",
    subtitle: "A community-funded advertising platform designed to help critical messages travel beyond creators' existing personal bubbles.",
    sections: [
      {
        heading: "Why We Built Amplify Together",
        body: "Social platforms and traditional search engines heavily throttle non-commercial civic messages unless users pay exorbitant ad network rates. Important community issues—like lead in school water pipes, regional bus route cuts, or independent scientific studies—struggle to break out of small echo chambers.\n\nAmplify Together enables communities to pool resources specifically for the media distribution cost of advertising these messages to the public.",
      },
      {
        heading: "Strict Anti-Donation Principle",
        body: "Amplify Together is NOT a donation or fundraising platform. Every contributed dollar is earmarked exclusively for external advertising placements, transparent reviewer moderation, and payment network fees. Contributions never go to the creator, organization, or cause directly.",
      },
      {
        heading: "Editorial Fact-Checking Standards",
        body: "Before any campaign opens for public funding, platform reviewers audit all factual claims against public records, verified scientific studies, and municipal data. Unverified or misleading claims are rejected.",
      },
    ],
  },
  "how-it-works": {
    title: "How Amplify Together Works",
    subtitle: "The 3-stage lifecycle: Create -> Review -> Amplify.",
    sections: [
      {
        heading: "Stage 1: Create the Message",
        body: "Creators draft an editorial story supported by at least one verifiable public citation. They define their target audience (locations, channels, and interests) and set their amplification funding goal.",
      },
      {
        heading: "Stage 2: Independent Review",
        body: "Platform moderators verify factual sources, ensure advertising copy adheres to consumer protection standards, and configure fair auction bid ceilings.",
      },
      {
        heading: "Stage 3: Community Amplification",
        body: "Backers contribute toward the advertising cost. Once funded, ads run across digital news outlets, social feeds, and local billboards. Complete telemetry is published in a final public report.",
      },
    ],
  },
  faqs: {
    title: "Frequently Asked Questions",
    subtitle: "Clear answers on platform rules, funding mechanisms, and advertising reach.",
    sections: [],
    faqs: [
      {
        question: "Is contributing to a campaign considered a donation?",
        answer: "No. Contributions on Amplify Together are not charitable donations. Your contribution pays specifically for digital and billboard advertising placements to distribute the creator's message to target audiences outside their network.",
      },
      {
        question: "What happens if a campaign does not reach 100% of its goal?",
        answer: "All campaigns use transparent all-or-nothing milestone rules. If a campaign does not achieve minimum funding threshold within its duration, contributed funds are automatically refunded to backers' payment methods with zero penalties.",
      },
      {
        question: "How are audience reach numbers calculated?",
        answer: "Reach is calculated as a range based on real-time CPM (cost-per-thousand impressions) ad network auction models. We always label these as 'Estimated, not guaranteed' because actual delivery varies with seasonal bid competition and reader engagement.",
      },
      {
        question: "Who reviews campaign messages before they go live?",
        answer: "Our independent editorial team reviews all submissions. Creators must provide verifiable public citations (such as municipal records, government reports, or peer-reviewed studies). Ads with unsubstantiated or deceptive claims are rejected.",
      },
      {
        question: "How do I know the advertising actually ran?",
        answer: "Every completed campaign publishes a public Final Distribution Report. This includes audited ad server impression counts, click-through rates, geographic heatmaps, and third-party receipt verification.",
      },
    ],
  },
  help: {
    title: "Help & Support",
    subtitle: "Need assistance with a campaign, contribution, or review status?",
    sections: [
      {
        heading: "Creator Support",
        body: "If you have questions about structuring your story blocks, linking evidence, or responding to moderator feedback, our creator desk is available 24/7.",
      },
      {
        heading: "Backer & Receipt Inquiries",
        body: "Receipts are automatically generated and saved in your Profile tab under 'Payments'. For transaction receipts or refund inquiries, please reference your receipt number.",
      },
    ],
  },
  contact: {
    title: "Contact Us",
    subtitle: "Reach out to the Amplify Together team.",
    sections: [
      {
        heading: "Editorial & Review Inquiries",
        body: "editorial@amplifytogether.org\nFor questions regarding moderation standards or appeals.",
      },
      {
        heading: "Community & Media Partnerships",
        body: "partners@amplifytogether.org\nFor newsrooms, civic coalitions, and public interest organizations.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Platform policies and advertising amplification terms.",
    sections: [
      {
        heading: "1. Nature of Service",
        body: "Amplify Together provides advertising pooling and campaign management software. Contributions fund media distribution expenses and do not represent personal donations or investments.",
      },
      {
        heading: "2. Truth in Advertising",
        body: "All creator campaigns must provide valid public citations. Defamatory, fraudulent, hate-speech, or deceptive claims are strictly prohibited and subject to immediate removal.",
      },
      {
        heading: "3. Refunds & Unspent Ad Funds",
        body: "If ad delivery cannot be completed due to inventory unavailability or publisher rejection, unspent funds are returned to backer accounts according to our transparent refund policy.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "How we protect backer identities and campaign information.",
    sections: [
      {
        heading: "Backer Privacy by Default",
        body: "Backer names default to private across all contributions. We do not sell user data to data brokers or third-party ad networks. We only collect essential payment and receipt delivery information.",
      },
      {
        heading: "Simulated Demo Protection",
        body: "In prototype demonstration mode, test payment data is never sent to real credit card processors.",
      },
    ],
  },
  guidelines: {
    title: "Community Guidelines",
    subtitle: "Standards for respectful, fact-based civic amplification.",
    sections: [
      {
        heading: "Evidence-First Storytelling",
        body: "Every claim should be grounded in observable facts and supported by primary sources. Opinion commentary must be clearly distinguished from empirical statistics.",
      },
      {
        heading: "No Harassment or Targeted Abuse",
        body: "Campaigns designed to intimidate, bully, or doxx individuals are rejected during moderation without appeal.",
      },
    ],
  },
  partners: {
    title: "Publishing Partners",
    subtitle: "Independent journalism networks and community billboard collectives.",
    sections: [
      {
        heading: "Independent Media Alliance",
        body: "We partner with over 450 regional journalism outlets, non-profit investigative desks, and open web publishers to deliver public interest messages alongside trusted reporting.",
      },
      {
        heading: "Fair Ad Inventory Exchange",
        body: "Our publisher network guarantees brand safety and non-intrusive placement standards, ensuring your campaign is treated with editorial respect.",
      },
    ],
  },
};

export default function StaticInfoScreen() {
  const router = useRouter();
  const { page } = useLocalSearchParams<{ page: string }>();

  const [contactSubject, setContactSubject] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [sentFeedback, setSentFeedback] = useState(false);

  const pageKey = (page || "about").toLowerCase();
  const info = PAGE_DATA[pageKey] || PAGE_DATA.about;

  const handleSendContact = () => {
    if (!contactMsg.trim()) return;
    setSentFeedback(true);
    Alert.alert("Message Sent", "Thank you for reaching out. Our support team will respond within 24 hours.");
    setContactSubject("");
    setContactMsg("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={info.title} showBack />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Title Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.pageTitle, typography.storyHero]}>{info.title}</Text>
          <Text style={[styles.pageSubtitle, typography.body]}>{info.subtitle}</Text>
        </View>

        {/* Narrative Sections */}
        {info.sections.map((sec, idx) => (
          <View key={idx} style={styles.sectionCard}>
            <Text style={[styles.sectionHeading, typography.storyH2]}>{sec.heading}</Text>
            <Text style={[styles.sectionBody, typography.storyBody]}>{sec.body}</Text>
          </View>
        ))}

        {/* FAQs with Accordion */}
        {info.faqs && info.faqs.length > 0 && (
          <View style={styles.faqsSection}>
            <Text style={[styles.faqsHeader, typography.uiH2]}>Common Questions</Text>
            <View style={styles.accordionsWrap}>
              {info.faqs.map((faq, idx) => (
                <Accordion key={idx} title={faq.question} defaultExpanded={idx === 0}>
                  <Text style={[styles.faqAnswerText, typography.body]}>{faq.answer}</Text>
                </Accordion>
              ))}
            </View>
          </View>
        )}

        {/* Interactive Contact Form on Contact / Help pages */}
        {(pageKey === "contact" || pageKey === "help") && (
          <View style={styles.contactFormCard}>
            <Text style={[styles.contactFormTitle, typography.uiH2]}>Send Us a Message</Text>
            <Text style={[styles.contactFormSub, typography.caption]}>
              Have a question about a campaign or moderation review?
            </Text>

            <TextInput
              style={[styles.input, typography.uiBody]}
              placeholder="Subject..."
              placeholderTextColor={colors.slate400}
              value={contactSubject}
              onChangeText={setContactSubject}
            />

            <TextInput
              style={[styles.textArea, typography.uiBody]}
              placeholder="Write your inquiry or feedback..."
              placeholderTextColor={colors.slate400}
              multiline
              numberOfLines={4}
              value={contactMsg}
              onChangeText={setContactMsg}
            />

            <TouchableOpacity
              style={[styles.sendBtn, !contactMsg.trim() && styles.sendBtnDisabled]}
              onPress={handleSendContact}
              disabled={!contactMsg.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane" size={16} color={colors.white} />
              <Text style={[styles.sendBtnText, typography.uiH3]}>Send Message</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Anti-donation reminder banner on all info pages */}
        <View style={styles.trustBanner}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.trustTitle, typography.uiH3]}>Amplify Together Notice</Text>
            <Text style={[styles.trustBody, typography.caption]}>
              Contributions strictly pay for advertising distribution. This is not a donation platform.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  heroSection: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    color: colors.slate900,
  },
  pageSubtitle: {
    color: colors.slate600,
    lineHeight: 24,
  },
  sectionCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  sectionHeading: {
    color: colors.slate900,
  },
  sectionBody: {
    color: colors.slate700,
    lineHeight: 26,
  },
  faqsSection: {
    gap: spacing.md,
  },
  faqsHeader: {
    color: colors.slate900,
  },
  accordionsWrap: {
    gap: spacing.sm,
  },
  faqAnswerText: {
    color: colors.slate700,
    lineHeight: 24,
  },
  contactFormCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  contactFormTitle: {
    color: colors.slate900,
  },
  contactFormSub: {
    color: colors.slate500,
  },
  input: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.slate900,
  },
  textArea: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.slate900,
    textAlignVertical: "top",
    minHeight: 100,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.radiusMd,
    gap: spacing.xs,
    minHeight: 48,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: colors.white,
  },
  trustBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  trustTitle: {
    color: colors.primary,
  },
  trustBody: {
    color: colors.slate700,
  },
});
