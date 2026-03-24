import { motion } from "framer-motion";

const containerVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function StaggerList({ children, ...props }) {
	return (
		<motion.div variants={containerVariants} initial="hidden" animate="visible" {...props}>
			{children}
		</motion.div>
	);
}

export function StaggerItem({ children, ...props }) {
	return (
		<motion.div variants={itemVariants} {...props}>
			{children}
		</motion.div>
	);
}
