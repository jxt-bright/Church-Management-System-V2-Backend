const capitalize = (str) => {
    if (!str || typeof str !== 'string') return "";
    const cleanStr = str.trim();
    if (cleanStr.length === 0) return "";
    return cleanStr.charAt(0).toUpperCase() + cleanStr.slice(1);
};

const formatMessage = ({ message, salutation, firstName, addNames }) => {
    let greetingPart = "";
    
    const cleanMsg = message ? capitalize(message) : "";

    const hasSalutation = salutation && salutation.trim().length > 0;
    const hasName = addNames && firstName?.trim()?.length > 0;

    if (hasSalutation && hasName) {
        greetingPart = `${capitalize(salutation)} ${capitalize(firstName)},`;
    } else if (hasSalutation) {
        greetingPart = `${capitalize(salutation)},`;
    } else if (hasName) {
        greetingPart = `${capitalize(firstName)},`;
    }

    const finalResult = greetingPart ? `${greetingPart}\n${cleanMsg}` : cleanMsg;
    
    return finalResult;
};



export { formatMessage };