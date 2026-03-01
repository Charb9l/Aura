import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import PageContentEditor from "./PageContentEditor";

const HabitsTab = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="habits">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Habit Tracker</h1>
          <p className="text-muted-foreground">Manage the AI Habit Tracker page settings and content.</p>
        </div>
        <PageContentEditor pageSlug="habits" pageName="AI Habit Tracker" />
      </div>
      <Card className="bg-card border-border"><CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-secondary/30"><p className="text-sm font-semibold text-foreground mb-1">🔥 Streaks</p><p className="text-xs text-muted-foreground">Tracks consecutive weeks of activity per user.</p></div>
          <div className="p-4 rounded-lg border border-border bg-secondary/30"><p className="text-sm font-semibold text-foreground mb-1">🏆 8 Badges</p><p className="text-xs text-muted-foreground">First Step, Iron Will, Explorer, Early Bird, Night Owl, Dedicated, Unstoppable, Centurion.</p></div>
          <div className="p-4 rounded-lg border border-border bg-secondary/30"><p className="text-sm font-semibold text-foreground mb-1">📊 Wellness Score</p><p className="text-xs text-muted-foreground">0-100 score based on consistency (40%), variety (30%), frequency (30%).</p></div>
        </div>
      </CardContent></Card>
    </motion.div>
  );
};

export default HabitsTab;
