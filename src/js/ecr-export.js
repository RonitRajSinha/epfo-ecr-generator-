
export function generateECRText(members, monthDays) {
    return members.map((member) => {
        const gross = Math.round((member.days || 0) * (member.wage || 0));

        const epfWage = Math.min(gross, 15000);
        const epsWage = epfWage;
        const edliWage = epfWage;

        const epfContri = Math.round(epfWage * 0.12);
        const epsContri = Math.round(epsWage * 0.0833);
        const diffContri = epfContri - epsContri;

        const ncp = Math.max(0, monthDays - (member.days || 0));
        const refund = member.refund || 0;

        return [
            member.uan,
            member.name,
            gross,
            epfWage,
            epsWage,
            edliWage,
            epfContri,
            epsContri,
            diffContri,
            ncp,
            refund
        ].join("#~#");
    }).join("\n");
}

export function downloadECRFile(members, monthDays) {
    const content = generateECRText(members, monthDays);

    const blob = new Blob([content], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `EPFO_ECR_${date}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}
