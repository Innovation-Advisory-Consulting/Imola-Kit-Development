"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { UsersIcon } from "@phosphor-icons/react/dist/ssr/Users";
import useEmblaCarousel from "embla-carousel-react";

const reviews = [
	{
		id: "REV-1",
		author: "Sarah Mitchell",
		role: "Chief Information Officer",
		agency: "State Department of Health & Human Services",
		comment:
			"Imola Kit transformed our services. What used to take 6-8 weeks for processing now takes just 5 business days. Our users are thrilled with the self-service portal.",
	},
	{
		id: "REV-2",
		author: "James Rodriguez",
		role: "IT Director",
		agency: "County Department of Public Works",
		comment:
			"The mobile field apps have been a game-changer for our inspection teams. Offline capability means our inspectors can work in rural areas without connectivity issues, and everything syncs when they're back online.",
	},
	{
		id: "REV-3",
		author: "Dr. Amanda Chen",
		role: "Program Director",
		agency: "Federal Grants Administration Office",
		comment:
			"Managing complex programs across 200+ workflows was overwhelming with our legacy system. Imola Kit's management module gave us complete visibility and reduced issues by 78%.",
	},
	{
		id: "REV-4",
		author: "Michael Thompson",
		role: "Deputy Commissioner",
		agency: "State Department of Revenue",
		comment:
			"We evaluated five platforms before choosing Imola Kit. The combination of user-facing portal, back-office automation, and mobile tools — all on one platform — made the decision easy. Implementation was smooth and on schedule.",
	},
	{
		id: "REV-5",
		author: "Patricia Williams",
		role: "Director of Modernization",
		agency: "City of Metropolitan Services",
		comment:
			"Imola Kit helped us consolidate 12 separate legacy systems into one unified platform. Our staff productivity increased by 40%, and satisfaction scores jumped from 62% to 91% in the first year.",
	},
];

export function Testimonails() {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
	const [prevBtnDisabled, setPrevBtnDisabled] = React.useState(true);
	const [nextBtnDisabled, setNextBtnDisabled] = React.useState(true);
	const [selectedIndex, setSelectedIndex] = React.useState(0);
	const [scrollSnaps, setScrollSnaps] = React.useState([]);

	const scrollPrev = React.useCallback(() => {
		emblaApi?.scrollPrev();
	}, [emblaApi]);

	const scrollNext = React.useCallback(() => {
		emblaApi?.scrollNext();
	}, [emblaApi]);

	const scrollTo = React.useCallback(
		(index) => {
			emblaApi?.scrollTo(index);
		},
		[emblaApi]
	);

	const onInit = React.useCallback((api) => {
		setScrollSnaps(api.scrollSnapList());
	}, []);

	const onSelect = React.useCallback((api) => {
		setSelectedIndex(api.selectedScrollSnap());
		setPrevBtnDisabled(!api.canScrollPrev());
		setNextBtnDisabled(!api.canScrollNext());
	}, []);

	React.useEffect(() => {
		if (!emblaApi) return;

		onInit(emblaApi);
		onSelect(emblaApi);
		emblaApi.on("reInit", onInit);
		emblaApi.on("reInit", onSelect);
		emblaApi.on("select", onSelect);
	}, [emblaApi, onInit, onSelect]);

	return (
		<Box
			sx={{
				bgcolor: "var(--mui-palette-background-level1)",
				borderTop: "1px solid var(--mui-palette-divider)",
				pt: "120px",
			}}
		>
			<Container maxWidth="md">
				<Stack spacing={8}>
					<Stack spacing={2}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<Chip color="primary" icon={<UsersIcon />} label="Success Stories" variant="soft" />
						</Box>
						<Typography sx={{ textAlign: "center" }} variant="h3">
							Trusted by Government Agencies
						</Typography>
					</Stack>
					<Stack spacing={3} sx={{ "--slide-spacing": "1rem", "--slide-size": "100%", "--slide-height": " 300px" }}>
						<Box ref={emblaRef} sx={{ overflow: "hidden" }}>
							<Box
								sx={{
									backfaceVisibility: "hidden",
									display: "flex",
									touchAction: "pan-y",
									ml: "calc(var(--slide-spacing) * -1)",
								}}
							>
								{reviews.map((review) => (
									<Stack
										key={review.id}
										spacing={2}
										sx={{
											flex: "0 0 var(--slide-size)",
											minWidth: 0,
											pl: "var(--slide-spacing)",
											position: "relative",
										}}
									>
										<Typography color="text.secondary" sx={{ textAlign: "center", fontStyle: "italic" }}>
											&ldquo;{review.comment}&rdquo;
										</Typography>
										<Stack spacing={0.5} sx={{ alignItems: "center" }}>
											<Typography sx={{ textAlign: "center", fontWeight: 600 }}>{review.author}</Typography>
											<Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
												{review.role}
											</Typography>
											<Typography color="primary.main" sx={{ textAlign: "center" }} variant="caption">
												{review.agency}
											</Typography>
										</Stack>
									</Stack>
								))}
							</Box>
						</Box>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
							<IconButton disabled={prevBtnDisabled} onClick={scrollPrev}>
								<CaretLeftIcon />
							</IconButton>
							<Stack direction="row" spacing={1} sx={{ flex: "1 1 auto", justifyContent: "center" }}>
								{scrollSnaps.map((_, index) => (
									<Box
										key={index}
										onClick={() => {
											scrollTo(index);
										}}
										sx={{
											bgcolor:
												index === selectedIndex
													? "var(--mui-palette-primary-main)"
													: "var(--mui-palette-action-selected)",
											borderRadius: "50%",
											cursor: "pointer",
											height: "8px",
											mx: "0.25rem",
											width: "8px",
										}}
									/>
								))}
							</Stack>
							<IconButton disabled={nextBtnDisabled} onClick={scrollNext}>
								<CaretRightIcon />
							</IconButton>
						</Stack>
					</Stack>
				</Stack>
			</Container>
		</Box>
	);
}
