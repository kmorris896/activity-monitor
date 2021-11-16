ALTER TABLE chatTable
ADD COLUMN madeActive INTEGER DEFAULT 0;

UPDATE chatTable 
SET madeActive = 0;
