import { Body, Controller, Post, Get, Query, Patch, Param } from '@nestjs/common';
import { CreatePaymentUseCase } from '../../application/use-cases/payment/create-payment/create-payment.use-case';
import { ListPaymentsUseCase } from '../../application/use-cases/payment/list-payment/list-payments.use-case';
import { UpdateStatusUseCase } from '../../application/use-cases/payment/update-status/update-status.use-case';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentMethod, PaymentStatus } from '../../domain/entities/payment.entity';
import { GetPaymentByIdUseCase } from 'src/application/use-cases/payment/get-payment/get-payment-by-id.use-case';

@Controller('api/payment')
export class PaymentController {
    constructor(
        private readonly createUseCase: CreatePaymentUseCase,
        private readonly listUseCase: ListPaymentsUseCase,
        private readonly updateStatusUseCase: UpdateStatusUseCase,
        private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
    ) { }

    @Post()
    async create(@Body() dto: CreatePaymentDto) {
        return await this.createUseCase.execute(dto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
      return await this.getPaymentByIdUseCase.execute(id);
    }

    @Get()
    async findAll(
        @Query('cpf') cpf?: string,
        @Query('method') method?: PaymentMethod,
        @Query('status') status?: PaymentStatus,
    ) {
        return await this.listUseCase.execute({ cpf, method, status });
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: PaymentStatus,
    ) {
        return await this.updateStatusUseCase.execute(id, status);
    }

    @Post('webhook')
    async handleWebhook(@Body() body: any, @Query('topic') topic: string) {
        const resourceId = body.data?.id || body.id;
        const actualTopic = topic || body.type;

        if (actualTopic === 'payment') {
            await this.updateStatusUseCase.execute(resourceId);
        }

        return { received: true };
    }
}