import React from 'react';
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';

import { PrimaNotaPDF } from '../../../../components/pdf/prima-nota-pdf';

export async function POST(request) {
    try {
        const body = await request.json();
        const { transactions, options } = body;

        // Estrai i filtri dalle transazioni se disponibili
        const filters = {};

        if (transactions && transactions.length > 0) {
            // Estrai il range di date
            const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a - b);
            if (dates.length > 0) {
                filters.dateRange = {
                    start: dates[0],
                    end: dates[dates.length - 1],
                };
            }

            // Estrai conto corrente (prendi il primo se tutti uguali)
            const bankAccounts = [...new Set(transactions.map(t => t.ownername).filter(Boolean))];
            if (bankAccounts.length === 1) {
                filters.bankAccount = bankAccounts[0];
            } else if (bankAccounts.length > 1) {
                filters.bankAccount = 'Multipli';
            }

            // Estrai categoria (prendi la prima se tutti uguali)
            const categories = [...new Set(transactions.map(t => t.category_name).filter(Boolean))];
            if (categories.length === 1) {
                filters.category = categories[0];
            } else if (categories.length > 1) {
                filters.category = 'Multiple';
            }

            // Estrai soggetto (prendi il primo se tutti uguali)
            const subjects = [...new Set(transactions.map(t => t.subject_name).filter(Boolean))];
            if (subjects.length === 1) {
                filters.subject = subjects[0];
            } else if (subjects.length > 1) {
                filters.subject = 'Multipli';
            }

            // Estrai dettaglio (prendi il primo se tutti uguali)
            const details = [...new Set(transactions.map(t => t.detail_name).filter(Boolean))];
            if (details.length === 1) {
                filters.detail = details[0];
            } else if (details.length > 1) {
                filters.detail = 'Multipli';
            }
        }

        // Genera il PDF usando React.createElement
        const pdfElement = React.createElement(PrimaNotaPDF, {
            transactions,
            options,
            filters,
        });

        // Genera lo stream del PDF
        const stream = await renderToStream(pdfElement);

        // Leggi lo stream e converti in buffer
        const chunks = [];

        // Usa un approccio compatibile con Node.js streams
        await new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        const buffer = Buffer.concat(chunks);

        // Restituisci il PDF come response
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="elenco-movimenti-${new Date().toISOString().split('T')[0]}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Errore nella generazione del PDF:', error);
        return NextResponse.json(
            { error: 'Errore nella generazione del PDF', details: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
