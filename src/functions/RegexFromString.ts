import { stringRegexMatcherForBuildLabel, stringRegexMatcherForMajor, stringRegexMatcherForMinor, stringRegexMatcherForPatch, stringRegexMatcherForQuad, stringRegexMatcherForReleaseLabel } from "../utils/constants";

const matchers: Record<string, string> = {
	major: stringRegexMatcherForMajor,
	minor: stringRegexMatcherForMinor,
	patch: stringRegexMatcherForPatch,
	quad: stringRegexMatcherForQuad,
	releaseLabel: stringRegexMatcherForReleaseLabel,
	buildLabel: stringRegexMatcherForBuildLabel,
};

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function makeRegexpFromStringFormat (stringRule: string): RegExp {
	const placeholderPattern = /\{(major|minor|patch|quad|releaseLabel|buildLabel)\}/g;
	let source = "";
	let lastIndex = 0;

	for (const match of stringRule.matchAll(placeholderPattern)) {
		const placeholder = match[1];
		const matcher = matchers[placeholder];
		if (matcher === undefined || match.index === undefined) {
			continue;
		}
		source += escapeRegex(stringRule.slice(lastIndex, match.index));
		source += matcher;
		lastIndex = match.index + match[0].length;
	}

	source += escapeRegex(stringRule.slice(lastIndex));
	return new RegExp(source, "gm");
}
