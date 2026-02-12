
import { Member } from '../models/members_model.js'
import smsProvider from '../utils/smsProvider.utils.js'
import { formatMessage } from '../utils/messageFormatter.utils.js'

const BATCH_SIZE = 30;

const sendMessages = async (data) => {
    const { groupId, churchId, category, message, salutation, addNames, targetType } = data;

    let filter = {};
    if (targetType === 'group' && groupId) filter.groupId = groupId;
    else if (targetType === 'church' && churchId) filter.churchId = churchId;

    if (category !== 'members') {
        const categoryMap = {
            workers: { memberStatus: 'Worker' },
            adults: { category: 'Adult' },
            youths: { category: 'Youth' },
            males: { gender: 'Male' },
            females: { gender: 'Female' }
        };
        Object.assign(filter, categoryMap[category]);
    }

    const cursor = Member.find(filter)
        .select('phoneNumber firstName')
        .lean()
        .cursor();

    let recipientCount = 0;
    let batch = [];

    for (let member = await cursor.next(); member != null; member = await cursor.next()) {
        recipientCount++;

        // Construct Personalized Message
        const finalMessage = formatMessage({
            message,
            salutation,
            firstName: member.firstName,
            addNames
        });

        batch.push(smsProvider.send(member.phoneNumber, finalMessage));

        if (batch.length === BATCH_SIZE) {
            // allSettled ensures if one phone number fails, the others still send
            await Promise.allSettled(batch);
            batch = [];
        }
    }

    if (batch.length > 0) {
        await Promise.allSettled(batch);
    }

    if (recipientCount === 0) {
        const error = new Error("No recipients found.");
        error.statusCode = 404;
        throw error;
    }

    return { recipientCount };
}


export {
    sendMessages
}