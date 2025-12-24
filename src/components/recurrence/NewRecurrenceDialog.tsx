
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recurrenceService } from "@/services/recurrence";
import { RecurrenceFrequency } from "@/types/recurrence";
import { Plus } from "lucide-react";

const schema = z.object({
    borrowerName: z.string().min(3, "Nome do cliente é obrigatório"),
    serviceDescription: z.string().min(5, "Descrição do serviço é obrigatória"),
    amount: z.coerce.number().min(0.01, "Valor deve ser positivo"),
    frequency: z.nativeEnum(RecurrenceFrequency),
    nextRunDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
    autoSendEmail: z.boolean().default(false)
});

type FormData = z.infer<typeof schema>;

export function NewRecurrenceDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Explicitly casting resolver to avoid strict match issues with coerce
    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            frequency: RecurrenceFrequency.MONTHLY,
            autoSendEmail: false
        }
    });

    const mutation = useMutation({
        mutationFn: recurrenceService.addRecurrence,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurrences'] });
            toast({ title: "Sucesso", description: "Assinatura criada com sucesso." });
            setOpen(false);
            reset();
        },
        onError: () => {
            toast({ title: "Erro", description: "Não foi possível criar a assinatura.", variant: "destructive" });
        }
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Nova Assinatura
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Assinatura Recorrente</DialogTitle>
                    <DialogDescription>
                        Configure a cobrança automática para seu cliente.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="borrowerName">Cliente</Label>
                        <Input id="borrowerName" {...register("borrowerName")} placeholder="Nome da empresa ou pessoa" />
                        {errors.borrowerName && <span className="text-xs text-red-500">{errors.borrowerName.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="serviceDescription">Serviço</Label>
                        <Input id="serviceDescription" {...register("serviceDescription")} placeholder="Ex: Manutenção Mensal" />
                        {errors.serviceDescription && <span className="text-xs text-red-500">{errors.serviceDescription.message}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor (R$)</Label>
                            <Input id="amount" type="number" step="0.01" {...register("amount")} />
                            {errors.amount && <span className="text-xs text-red-500">{errors.amount.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="frequency">Frequência</Label>
                            <select
                                id="frequency"
                                {...register("frequency")}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value={RecurrenceFrequency.MONTHLY}>Mensal</option>
                                <option value={RecurrenceFrequency.WEEKLY}>Semanal</option>
                                <option value={RecurrenceFrequency.YEARLY}>Anual</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nextRunDate">Próxima Execução</Label>
                        <Input id="nextRunDate" type="date" {...register("nextRunDate")} />
                        {errors.nextRunDate && <span className="text-xs text-red-500">{errors.nextRunDate.message}</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="autoSendEmail"
                            {...register("autoSendEmail")}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="autoSendEmail" className="font-normal">Enviar NFS-e e Boleto por email automaticamente</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Criando..." : "Criar Assinatura"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
