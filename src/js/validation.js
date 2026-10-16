
export function validateMember(member, monthDays) {
    const errors = [];

    if (!/^\d{12}$/.test(String(member.uan ?? "").trim())) {
        errors.push("UAN must contain exactly 12 digits.");
    }

    if (!String(member.name ?? "").trim()) {
        errors.push("Employee name is required.");
    }

    const wage = Number(member.wage);
    if (member.wage === "" || !Number.isFinite(wage) || wage < 0) {
        errors.push("Daily wage must be a valid, non-negative number.");
    }

    const days = Number(member.days);
    if (
        member.days === "" ||
        !Number.isInteger(days) ||
        days < 0 ||
        days > monthDays
    ) {
        errors.push(`Days worked must be a whole number from 0 to ${monthDays}.`);
    }

    const refund = Number(member.refund ?? 0);
    if (!Number.isFinite(refund) || refund < 0) {
        errors.push("Refund must be a valid, non-negative number.");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
