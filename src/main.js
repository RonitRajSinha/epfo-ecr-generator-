
import "./style.css";

import { calculateMember } from "./js/calculations.js";
import { generateECRText, downloadECRFile } from "./js/ecr-export.js";
import { saveMembers, loadMembers, clearSavedMembers } from "./js/storage.js";
import { validateMember } from "./js/validation.js";

const form = document.querySelector("#employee-form");
const monthDaysSelect = document.querySelector("#month-days");
const tableBody = document.querySelector("#employee-table-body");
const formMessage = document.querySelector("#form-message");

const totalEmployees = document.querySelector("#total-employees");
const totalWages = document.querySelector("#total-wages");
const totalEPF = document.querySelector("#total-epf");
const recordCount = document.querySelector("#record-count");

const resetButton = document.querySelector("#reset-form");
const clearAllButton = document.querySelector("#clear-all");
const exportButton = document.querySelector("#export-ecr");

let members = loadMembers();

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
});

function getMonthDays() {
    return Number(monthDaysSelect.value);
}

function formatCurrency(value) {
    return currencyFormatter.format(value);
}

function showMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle("error", isError);
}

function persistMembers() {
    try {
        saveMembers(members);
        return true;
    } catch (error) {
        console.error("Could not save employee records:", error);
        showMessage("Could not save records in this browser.", true);
        return false;
    }
}

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    return cell;
}

function renderMembers() {
    const monthDays = getMonthDays();

    tableBody.replaceChildren();

    if (members.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.className = "empty-state";

        const icon = document.createElement("span");
        icon.className = "empty-icon";
        icon.textContent = "↳";

        const title = document.createElement("strong");
        title.textContent = "No employee records yet";

        const description = document.createElement("span");
        description.textContent = "Add an employee using the form above.";

        cell.append(icon, title, description);
        row.appendChild(cell);
        tableBody.appendChild(row);
    } else {
        members.forEach((member) => {
            const row = document.createElement("tr");
            const calculated = calculateMember(member, monthDays);

            row.append(
                createCell(member.uan),
                createCell(member.name),
                createCell(member.days),
                createCell(formatCurrency(member.wage)),
                createCell(formatCurrency(calculated.gross)),
                createCell(formatCurrency(calculated.epfContri))
            );

            const actionsCell = document.createElement("td");
            const removeButton = document.createElement("button");

            removeButton.type = "button";
            removeButton.className = "button button-danger";
            removeButton.textContent = "Remove";
            removeButton.setAttribute(
                "aria-label",
                `Remove employee ${member.name}`
            );

            removeButton.addEventListener("click", () => {
                const confirmed = window.confirm(
                    `Remove ${member.name} from the employee register?`
                );

                if (!confirmed) return;

                const previousMembers = members;
                members = members.filter(
                    (item) => item.uan !== member.uan
                );

                if (persistMembers()) {
                    renderMembers();
                    showMessage("Employee removed.");
                } else {
                    members = previousMembers;
                    renderMembers();
                }
            });

            actionsCell.appendChild(removeButton);
            row.appendChild(actionsCell);
            tableBody.appendChild(row);
        });
    }

    const totals = members.reduce(
        (result, member) => {
            const calculated = calculateMember(member, monthDays);

            result.wages += calculated.gross;
            result.epf += calculated.epfContri;

            return result;
        },
        { wages: 0, epf: 0 }
    );

    totalEmployees.textContent = String(members.length);
    totalWages.textContent = formatCurrency(totals.wages);
    totalEPF.textContent = formatCurrency(totals.epf);
    recordCount.textContent =
        `${members.length} ${members.length === 1 ? "record" : "records"}`;

    document.querySelector("#days-worked").max = String(monthDays);
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const member = {
        uan: document.querySelector("#uan").value.trim(),
        name: document.querySelector("#employee-name").value.trim(),
        days: Number(document.querySelector("#days-worked").value),
        wage: Number(document.querySelector("#daily-wage").value),
        refund: Number(document.querySelector("#refund").value || 0)
    };

    const validation = validateMember(member, getMonthDays());

    if (!validation.isValid) {
        showMessage(validation.errors.join(" "), true);
        return;
    }

    if (members.some((item) => item.uan === member.uan)) {
        showMessage("This UAN already exists in the register.", true);
        return;
    }

    members.push(member);

    if (!persistMembers()) {
        members.pop();
        return;
    }

    renderMembers();
    form.reset();
    showMessage("Employee added successfully.");
    document.querySelector("#uan").focus();
});

resetButton.addEventListener("click", () => {
    form.reset();
    showMessage("");
});

monthDaysSelect.addEventListener("change", () => {
    const maxDays = getMonthDays();
    const daysInput = document.querySelector("#days-worked");

    daysInput.max = String(maxDays);

    if (Number(daysInput.value) > maxDays) {
        showMessage(
            `The days-worked input must be ${maxDays} or fewer for this month.`,
            true
        );
    } else {
        showMessage("");
    }

    renderMembers();
});

clearAllButton.addEventListener("click", () => {
    if (members.length === 0) {
        showMessage("There are no records to clear.", true);
        return;
    }

    const confirmed = window.confirm(
        "Clear all employee records saved in this browser? This cannot be undone."
    );

    if (!confirmed) return;

    const previousMembers = members;
    members = [];

    if (persistMembers()) {
        clearSavedMembers();
        renderMembers();
        showMessage("All employee records cleared.");
    } else {
        members = previousMembers;
        renderMembers();
    }
});

exportButton.addEventListener("click", () => {
    if (members.length === 0) {
        window.alert("Add at least one employee before exporting the ECR file.");
        return;
    }

    const monthDays = getMonthDays();

    const hasInvalidDays = members.some(
        (member) =>
            !Number.isInteger(Number(member.days)) ||
            Number(member.days) < 0 ||
            Number(member.days) > monthDays
    );

    if (hasInvalidDays) {
        window.alert(
            "At least one employee has invalid days worked for the selected month. Please correct the records before exporting."
        );
        return;
    }

    const content = generateECRText(members, monthDays);

    if (!content) {
        window.alert("No ECR content was generated.");
        return;
    }

    downloadECRFile(members, monthDays);
    showMessage("ECR text file generated.");
});

renderMembers();
