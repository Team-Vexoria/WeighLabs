# TODO - SIH26035

# Client
- [ ] UI/UX
    - [X] User (Operator) Login Page - Similar to *Windows 7 Bootup User Login Page*
    - [X] Home Page
        - [X] Reports
            - [X] View Reports
        - [X] Tests
            - [X] Initialization/Creation Page
            - [X] Real-Time Dashboard
- [ ] APP-BACKEND
    - [ ] Writing to SQLITE database
    - [X] Writing/Exporting to .csv / .docx / .pdf

# Server
- [ ] API
    - [ ] /tests
        - [ ] /tests/[id]
        - [ ] /tests?result=PASS&lab=[LAB-ID]&operator=[OPERATOR_ID]
    - [ ] /lab
        - [ ] /lab/[lab-id]
    - [ ] /operator
        - [ ] /operator/[operator-id]
    - [ ] /manufacturer
        - [ ] /manufacturer/[manufacturer-id]
- [ ] Database
    - [ ] Operators/Users
        - [ ] Authentication with EMAIL/Phone Number (OTP)
        - [ ] TABLE
            - [ ] ROLE
            - [ ] ID
            - [ ] FROM_LAB
            - [ ] PHONE_NUM
            - [ ] ADDRESS
            - [ ] MISC
            - [ ] PAST_EXPERIENCES
