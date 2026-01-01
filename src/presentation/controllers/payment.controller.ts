import { Body, Controller, Post, Get, Query, Patch, Param, Put, HttpCode, Delete } from '@nestjs/common';
import { CreatePaymentUseCase } from '../../application/use-cases/payment/create-payment/create-payment.use-case';
import { ListPaymentsUseCase } from '../../application/use-cases/payment/list-payment/list-payments.use-case';
import { UpdateStatusUseCase } from '../../application/use-cases/payment/update-status/update-status.use-case';
import { GetPaymentByIdUseCase } from '../../application/use-cases/payment/get-payment/get-payment-by-id.use-case';
import { DeletePaymentUseCase } from '../../application/use-cases/payment/delete-payment/delete-payment.use-case';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentMethod, PaymentStatus } from '../../domain/entities/payment.entity';


@Controller('api/payment')
export class PaymentController {
    constructor(
        private readonly createUseCase: CreatePaymentUseCase,
        private readonly listUseCase: ListPaymentsUseCase,
        private readonly updateStatusUseCase: UpdateStatusUseCase,
        private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
        private readonly deleteUseCase: DeletePaymentUseCase,
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
    ) {
        return await this.listUseCase.execute({ cpf, method });
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body('status') status: PaymentStatus,
    ) {
        return await this.updateStatusUseCase.execute(id, status);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id') id: string) {
        return await this.deleteUseCase.execute(id);
    }

    @Post('webhook')
    async handleWebhook(@Body() body: any, @Query() query: any) {
        const type = body.type || body.topic || query.topic;
        const paymentId = body.data?.id || query.id;

        if (type !== 'payment') {
            return { status: 'ignored' };
        }

        if (!paymentId) {
            console.error('Webhook de pagamento sem ID recebido');
            return { status: 'error', message: 'No ID found' };
        }

        return await this.updateStatusUseCase.execute(String(paymentId));
    }
}