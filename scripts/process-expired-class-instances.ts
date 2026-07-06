import { ClassInstanceExpiryService } from "@/backend/services/session/class-instance-expiry.service";

const processedCount = await ClassInstanceExpiryService.processExpiredInstances();
process.stdout.write(`Processed ${processedCount} expired class instance(s).\n`);
