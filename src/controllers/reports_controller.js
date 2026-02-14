
import * as reportsService from '../services/reports.service.js'


const monthlyReport = async (req, res) => {
    try {

        const monthlyReport = await reportsService.monthlyReport(req.query);

        res.status(200).json({
            success: true, 
            messsage: 'Report successfully generated',
            report: monthlyReport
        })
    } catch (error) {
        res.status(500).json({ message: 'Server Error'})
        
    }
}

export {
    monthlyReport,
}