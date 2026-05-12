import { Module } from '@nestjs/common';
import { MedicalRecordsService }    from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { DocumentsService }         from './documents.service';

@Module({
  providers:   [MedicalRecordsService, DocumentsService],
  controllers: [MedicalRecordsController],
  exports:     [MedicalRecordsService],
})
export class MedicalRecordsModule {}
