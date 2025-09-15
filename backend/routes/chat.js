/**
 * Chat Routes for Salyte Beacon AI Assistant
 * Handles AI chat interactions, message processing, and chat history
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { auth } = require('../middleware/auth');

/**
 * @route   POST /api/chat
 * @desc    Send message to AI assistant
 * @access  Private (optional - can be public for demo)
 */
router.post('/', async (req, res) => {
    try {
        const { message, chatId, context } = req.body;
        
        // Input validation
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Empty message',
                message: 'Please provide a message'
            });
        }
        
        if (message.length > 2000) {
            return res.status(400).json({
                error: 'Message too long',
                message: 'Message must be less than 2000 characters'
            });
        }
        
        // Process message and generate AI response
        const aiResponse = await generateAIResponse(message, context);
        
        // Mock chat ID generation
        const newChatId = chatId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Log the interaction
        console.log(`💬 AI Chat - User: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
        console.log(`🤖 AI Response: "${aiResponse.answer.substring(0, 50)}${aiResponse.answer.length > 50 ? '...' : ''}"`);
        
        res.json({
            success: true,
            chatId: newChatId,
            answer: aiResponse.answer,
            sources: aiResponse.sources,
            confidence: aiResponse.confidence,
            timestamp: new Date().toISOString(),
            tokensUsed: aiResponse.tokensUsed || 0
        });
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Chat processing failed',
            message: 'Unable to process your message. Please try again.',
            fallbackAnswer: "I'm experiencing technical difficulties. Please try rephrasing your question or contact support if this persists."
        });
    }
});

/**
 * @route   GET /api/chat/history
 * @desc    Get chat history for authenticated user
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        // Mock chat history data
        const mockHistory = [
            {
                id: 'chat_001',
                title: 'Water pH Analysis',
                preview: 'What is the ideal pH range for drinking water?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
                messageCount: 5
            },
            {
                id: 'chat_002',
                title: 'Filtration Methods',
                preview: 'Best water filtration for rural areas?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                messageCount: 8
            },
            {
                id: 'chat_003',
                title: 'Contamination Detection',
                preview: 'How to test for E. coli bacteria?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
                messageCount: 3
            }
        ];
        
        const startIndex = (page - 1) * limit;
        const paginatedHistory = mockHistory.slice(startIndex, startIndex + parseInt(limit));
        
        res.json({
            success: true,
            history: paginatedHistory,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(mockHistory.length / limit),
                hasNext: startIndex + parseInt(limit) < mockHistory.length,
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({
            error: 'Failed to fetch chat history',
            message: 'Unable to retrieve chat history'
        });
    }
});

/**
 * @route   GET /api/chat/:id
 * @desc    Get specific chat session
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Mock chat session data
        const mockChat = {
            id: id,
            title: 'Water pH Analysis',
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            messages: [
                {
                    type: 'user',
                    content: 'What is the ideal pH range for drinking water?',
                    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString()
                },
                {
                    type: 'ai',
                    content: 'The ideal pH range for drinking water is between 6.5 and 8.5 according to WHO guidelines. This range ensures the water is neither too acidic nor too alkaline, making it safe for consumption.',
                    sources: [
                        {
                            title: 'WHO Guidelines for Drinking-water Quality',
                            url: 'https://www.who.int/publications/i/item/9789241549950',
                            type: 'Official Guidelines'
                        }
                    ],
                    timestamp: new Date(Date.now() - 1000 * 60 * 54).toISOString()
                }
            ]
        };
        
        res.json({
            success: true,
            chat: mockChat
        });
        
    } catch (error) {
        console.error('Chat fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch chat',
            message: 'Unable to retrieve chat session'
        });
    }
});

/**
 * @route   DELETE /api/chat/:id
 * @desc    Delete chat session
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Mock deletion (in real app, delete from database)
        console.log(`🗑️ Deleted chat session: ${id}`);
        
        res.json({
            success: true,
            message: 'Chat session deleted successfully'
        });
        
    } catch (error) {
        console.error('Chat deletion error:', error);
        res.status(500).json({
            error: 'Failed to delete chat',
            message: 'Unable to delete chat session'
        });
    }
});

/**
 * Generate AI response (mock implementation)
 * In production, this would integrate with actual AI/ML services
 */
async function generateAIResponse(message, context = []) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const lowercaseMessage = message.toLowerCase();
    
    // Water quality responses
    if (lowercaseMessage.includes('ph') || lowercaseMessage.includes('acidity') || lowercaseMessage.includes('alkaline')) {
        return {
            answer: `The pH level is a crucial indicator of water quality. For drinking water, the WHO recommends a pH range of 6.5-8.5. pH below 6.5 indicates acidic water which can corrode pipes and leach metals, while pH above 8.5 indicates alkaline water which can cause scaling and bitter taste. Regular pH testing helps ensure water safety and system longevity.`,
            sources: [
                {
                    title: 'WHO Guidelines for Drinking-water Quality',
                    url: 'https://www.who.int/publications/i/item/9789241549950',
                    type: 'Official Guidelines',
                    description: 'World Health Organization standards for water quality parameters including pH'
                },
                {
                    title: 'EPA Water Quality Standards',
                    url: 'https://www.epa.gov/standards-water-body-activities',
                    type: 'Regulatory Standard',
                    description: 'US Environmental Protection Agency water quality criteria'
                }
            ],
            confidence: 0.95,
            tokensUsed: 150
        };
    }
    
    if (lowercaseMessage.includes('tds') || lowercaseMessage.includes('dissolved solids') || lowercaseMessage.includes('minerals')) {
        return {
            answer: `Total Dissolved Solids (TDS) measures the concentration of dissolved substances in water, including minerals, salts, and metals. The WHO suggests TDS levels below 1000 mg/L for drinking water, with optimal taste typically between 300-500 mg/L. High TDS doesn't necessarily indicate unsafe water, but very high levels (>1000 mg/L) may affect taste and could indicate contamination.`,
            sources: [
                {
                    title: 'WHO TDS Standards',
                    url: 'https://www.who.int/water_sanitation_health/dwq/chemicals/tds.pdf',
                    type: 'Technical Document',
                    description: 'WHO technical guidelines on total dissolved solids in drinking water'
                }
            ],
            confidence: 0.92,
            tokensUsed: 140
        };
    }
    
    if (lowercaseMessage.includes('bacteria') || lowercaseMessage.includes('e. coli') || lowercaseMessage.includes('microb') || lowercaseMessage.includes('pathogen')) {
        return {
            answer: `Bacterial contamination is a serious water safety concern. E. coli is used as an indicator organism for fecal contamination. Testing methods include membrane filtration, multiple tube fermentation, and rapid enzyme tests. For field testing, use sterile collection techniques and approved test kits. Professional lab analysis is recommended for accurate results. Boiling water for 1 minute kills most bacteria if contamination is suspected.`,
            sources: [
                {
                    title: 'CDC Water Testing Guidelines',
                    url: 'https://www.cdc.gov/healthywater/drinking/private/wells/testing.html',
                    type: 'Health Guidelines',
                    description: 'Centers for Disease Control guidelines for bacterial water testing'
                },
                {
                    title: 'EPA Microbial Testing Methods',
                    url: 'https://www.epa.gov/ground-water-and-drinking-water/microbiological',
                    type: 'Testing Protocol',
                    description: 'EPA approved methods for microbiological testing of water'
                }
            ],
            confidence: 0.97,
            tokensUsed: 180
        };
    }
    
    if (lowercaseMessage.includes('filter') || lowercaseMessage.includes('treatment') || lowercaseMessage.includes('purif') || lowercaseMessage.includes('clean')) {
        return {
            answer: `Water treatment options vary by contamination type and scale. For households: activated carbon filters remove chlorine and organics, reverse osmosis removes dissolved solids and most contaminants, UV sterilization kills microorganisms. For communities: slow sand filtration, chlorination, and multi-stage treatment systems. Choose treatment based on water testing results and specific contaminants present.`,
            sources: [
                {
                    title: 'WHO Water Treatment Guidelines',
                    url: 'https://www.who.int/water_sanitation_health/publications/drinking-water-guidelines/en/',
                    type: 'Treatment Guidelines',
                    description: 'WHO recommendations for household and community water treatment'
                },
                {
                    title: 'NSF/ANSI Standards for Water Treatment',
                    url: 'https://www.nsf.org/consumer-resources/water-quality',
                    type: 'Industry Standard',
                    description: 'NSF International standards for water treatment equipment'
                }
            ],
            confidence: 0.94,
            tokensUsed: 165
        };
    }
    
    if (lowercaseMessage.includes('turbidity') || lowercaseMessage.includes('cloudy') || lowercaseMessage.includes('clear') || lowercaseMessage.includes('visibility')) {
        return {
            answer: `Turbidity measures water clarity and is expressed in Nephelometric Turbidity Units (NTU). The WHO recommends turbidity below 1 NTU for drinking water, with levels above 4 NTU being easily visible. High turbidity can indicate contamination, interfere with disinfection, and harbor pathogens. Turbidimeters provide accurate measurements, while visual assessment can detect obvious cloudiness.`,
            sources: [
                {
                    title: 'WHO Turbidity Guidelines',
                    url: 'https://www.who.int/water_sanitation_health/dwq/chemicals/turbidity/en/',
                    type: 'Quality Standard',
                    description: 'WHO guidelines on turbidity in drinking water'
                }
            ],
            confidence: 0.90,
            tokensUsed: 135
        };
    }
    
    if (lowercaseMessage.includes('chlorine') || lowercaseMessage.includes('disinfect') || lowercaseMessage.includes('chemical')) {
        return {
            answer: `Chlorine is the most common water disinfectant. Free chlorine levels of 0.2-1.0 mg/L are typical in treated water supplies. While effective against bacteria and viruses, chlorine doesn't kill all parasites like Cryptosporidium. Test chlorine residual with DPD test kits or chlorine test strips. If chlorine taste/odor is strong, activated carbon filtration can reduce it while maintaining safety.`,
            sources: [
                {
                    title: 'EPA Chlorine Disinfection Guidelines',
                    url: 'https://www.epa.gov/ground-water-and-drinking-water/chlorine-residuals',
                    type: 'Regulatory Guidance',
                    description: 'EPA guidelines for chlorine residuals in drinking water systems'
                }
            ],
            confidence: 0.93,
            tokensUsed: 155
        };
    }
    
    // Default response for general or unrecognized queries
    return {
        answer: `I'm here to help with water quality, testing, and treatment questions. I can provide information about water parameters like pH, TDS, turbidity, bacterial contamination, filtration methods, and safety guidelines. For the most accurate and specific advice for your situation, please provide more details about your water quality concerns or testing needs.`,
        sources: [
            {
                title: 'WHO Guidelines for Drinking-water Quality',
                url: 'https://www.who.int/publications/i/item/9789241549950',
                type: 'Reference Guide',
                description: 'Comprehensive WHO guidelines covering all aspects of water quality'
            }
        ],
        confidence: 0.85,
        tokensUsed: 120
    };
}

module.exports = router;