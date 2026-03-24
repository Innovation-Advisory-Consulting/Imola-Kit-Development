import { motion } from "framer-motion";

import { useUserPreferences } from "@/components/core/user-preferences-context";

const pageVariants = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
	exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

export function AnimatedPage({ children }) {
	const { preferences } = useUserPreferences();

	if (!preferences.animationsEnabled) {
		return <div>{children}</div>;
	}

	return (
		<motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
			{children}
		</motion.div>
	);
}
