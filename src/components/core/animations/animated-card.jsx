import { motion } from "framer-motion";

const cardVariants = {
	hidden: { opacity: 0, y: 30, scale: 0.97 },
	visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

export function AnimatedCard({ children, ...props }) {
	return (
		<motion.div variants={cardVariants} initial="hidden" animate="visible" {...props}>
			{children}
		</motion.div>
	);
}
