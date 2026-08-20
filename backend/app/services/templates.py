WORKFLOW_TEMPLATES = [
    {
        "id": "tpl_invoice_processing",
        "name": "AI Invoice Scanner & Accounting Sync",
        "description": "Automatically extracts line items, totals, and vendor info from incoming invoice PDFs, verifies against purchase orders, and alerts finance in Slack.",
        "category": "Finance",
        "trigger": "Incoming email with invoice attachment (.pdf)",
        "trigger_type": "email",
        "nodes": ["email_received", "document_intelligence", "rag_knowledge_search", "ai_decision_gate", "send_slack_alert", "analytics"],
        "time_saved_mins": 35
    },
    {
        "id": "tpl_support_triage",
        "name": "AI Customer Support Ticket Triage",
        "description": "Classifies incoming customer issues by sentiment and urgency, retrieves relevant documentation via RAG, and drafts high-accuracy replies for agents.",
        "category": "Customer Support",
        "trigger": "New support ticket or email received",
        "trigger_type": "webhook",
        "nodes": ["webhook_trigger", "ai_sentiment_classifier", "rag_knowledge_search", "ai_summarizer", "send_slack_alert", "analytics"],
        "time_saved_mins": 25
    },
    {
        "id": "tpl_lead_qualification",
        "name": "Inbound Lead Scoring & HubSpot Sync",
        "description": "Scores website form leads using AI company intelligence, assigns qualified prospects to sales reps, and fires immediate Slack notifications.",
        "category": "Sales & Marketing",
        "trigger": "Website demo request form submitted",
        "trigger_type": "form",
        "nodes": ["form_submitted", "ai_data_extractor", "ai_decision_gate", "send_email_action", "send_slack_alert", "analytics"],
        "time_saved_mins": 20
    },
    {
        "id": "tpl_stripe_dunning",
        "name": "Stripe Failed Payment & Churn Recovery",
        "description": "Detects payment failures, queries customer health score, sends personalized AI retry emails and WhatsApp reminders to protect recurring revenue.",
        "category": "Finance",
        "trigger": "Stripe invoice.payment_failed webhook",
        "trigger_type": "stripe",
        "nodes": ["stripe_action", "ai_summarizer", "send_email_action", "send_whatsapp_message", "analytics"],
        "time_saved_mins": 45
    },
    {
        "id": "tpl_employee_onboarding",
        "name": "Automated Employee Onboarding Flow",
        "description": "Orchestrates account creation, sends welcome package, schedules introductory meetings, and tracks checklist progress across HR systems.",
        "category": "HR",
        "trigger": "New hire marked as accepted in ATS/HRIS",
        "trigger_type": "webhook",
        "nodes": ["webhook_trigger", "document_intelligence", "send_email_action", "send_slack_alert", "analytics"],
        "time_saved_mins": 60
    },
    {
        "id": "tpl_review_monitor",
        "name": "Negative Review AI Alert & Escalation",
        "description": "Monitors Google and Trustpilot reviews in real-time, categorizes negative feedback using sentiment analysis, and routes urgent alerts to management.",
        "category": "Operations",
        "trigger": "New review posted on public review platforms",
        "trigger_type": "webhook",
        "nodes": ["webhook_trigger", "ai_sentiment_classifier", "ai_summarizer", "send_slack_alert", "analytics"],
        "time_saved_mins": 15
    }
]
