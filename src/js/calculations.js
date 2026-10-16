
export function calculateMember(member, monthDays) {
    const gross = Math.round((member.days || 0) * (member.wage || 0));

    const epfWage = Math.min(gross, 15000);
    const epsWage = epfWage;
    const edliWage = epfWage;

    const epfContri = Math.round(epfWage * 0.12);
    const epsContri = Math.round(epsWage * 0.0833);
    const diffContri = epfContri - epsContri;

    const ncp = Math.max(0, monthDays - (member.days || 0));
    const refund = member.refund || 0;

    return {
        gross,
        epfWage,
        epsWage,
        edliWage,
        epfContri,
        epsContri,
        diffContri,
        ncp,
        refund
    };
}
