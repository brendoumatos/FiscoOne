-- FiscoOne Azure SQL Schema
-- Created at: 2025-12-23

-- 1. Users Table
-- Stores authentication and profile data.
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
BEGIN
    CREATE TABLE users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(512) NOT NULL, -- To be populated by backend hashing (bcrypt)
        full_name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL CHECK (role IN ('CLIENT', 'ACCOUNTANT', 'ADMIN')),
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX idx_users_email ON users(email);
END
GO

-- 2. Companies Table
-- Stores company profiles.
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='companies' and xtype='U')
BEGIN
    CREATE TABLE companies (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        owner_id UNIQUEIDENTIFIER NOT NULL,
        cnpj NVARCHAR(14) NOT NULL UNIQUE,
        legal_name NVARCHAR(255) NOT NULL,
        trade_name NVARCHAR(255) NOT NULL,
        tax_regime NVARCHAR(50) NOT NULL,
        cnae NVARCHAR(20),
        
        -- Address structured columns
        address_zip NVARCHAR(8),
        address_street NVARCHAR(255),
        address_number NVARCHAR(20),
        address_neighborhood NVARCHAR(100),
        address_city NVARCHAR(100),
        address_state NVARCHAR(2),
        
        -- JSON storage for flexible bank info
        bank_info_json NVARCHAR(MAX),
        
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        active BIT DEFAULT 1,
        
        CONSTRAINT FK_Companies_Users FOREIGN KEY (owner_id) REFERENCES users(id)
    );
    CREATE INDEX idx_companies_owner ON companies(owner_id);
    CREATE INDEX idx_companies_cnpj ON companies(cnpj);
END
GO

-- 3. Invoices Table
-- Metadata for invoices. XML/PDFs are stored in Azure Blob Storage.
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='invoices' and xtype='U')
BEGIN
    CREATE TABLE invoices (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        company_id UNIQUEIDENTIFIER NOT NULL,
        
        -- Sequential number handling
        number INT IDENTITY(1,1) NOT NULL, 
        
        issue_date DATETIME2 NOT NULL,
        status NVARCHAR(50) NOT NULL CHECK (status IN ('DRAFT', 'PROCESSING', 'ISSUED', 'ERROR', 'CANCELLED')),
        amount DECIMAL(18, 2) NOT NULL,
        
        -- Borrower Snapshot (Data at moment of issuance)
        borrower_doc NVARCHAR(14) NOT NULL,
        borrower_name NVARCHAR(255) NOT NULL,
        
        -- Links to Data Lake
        xml_storage_url NVARCHAR(1024),
        pdf_storage_url NVARCHAR(1024),
        
        created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
        
        CONSTRAINT FK_Invoices_Companies FOREIGN KEY (company_id) REFERENCES companies(id)
    );
    CREATE INDEX idx_invoices_company ON invoices(company_id);
    CREATE INDEX idx_invoices_date ON invoices(issue_date);
END
GO
