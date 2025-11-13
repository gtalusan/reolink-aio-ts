export const HEADERS: Record<string, string> = {
  "Content-Type": "application/soap+xml;charset=UTF-8"
};

export const SUBSCRIBE_ACTION = {
  action: "http://docs.oasis-open.org/wsn/bw-2/NotificationProducer/SubscribeRequest"
};

export const RENEW_ACTION = {
  action: "http://docs.oasis-open.org/wsn/bw-2/SubscriptionManager/RenewRequest"
};

export const UNSUBSCRIBE_ACTION = {
  action: "http://docs.oasis-open.org/wsn/bw-2/SubscriptionManager/UnsubscribeRequest"
};

export const PULLPOINT_ACTION = {
  action: "http://www.onvif.org/ver10/events/wsdl/EventPortType/CreatePullPointSubscriptionRequest"
};

export const PULLMESSAGE_ACTION = {
  action: "http://www.onvif.org/ver10/events/wsdl/PullPointSubscription/PullMessagesRequest"
};

type TemplateParams = Record<string, string>;

function renderTemplate(template: string, params: TemplateParams): string {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_, key: string) => params[key] ?? "");
}

const SUBSCRIBE_XML_TEMPLATE = `
    <soap:Envelope xmlns:add="http://www.w3.org/2005/08/addressing" xmlns:b="http://docs.oasis-open.org/wsn/b-2" xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <add:Action>http://docs.oasis-open.org/wsn/bw-2/NotificationProducer/SubscribeRequest</add:Action>
            <wsse:Security soap:mustUnderstand="true" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
                <wsse:UsernameToken wsu:Id="UsernameToken-{UsernameToken}">
                    <wsse:Username>{Username}</wsse:Username>
                    <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">{PasswordDigest}</wsse:Password>
                    <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">{Nonce}</wsse:Nonce>
                    <wsu:Created>{Created}</wsu:Created>
                </wsse:UsernameToken>
            </wsse:Security>
        </soap:Header>
        <soap:Body>
            <b:Subscribe>
                <b:ConsumerReference>
                    <add:Address>{Address}</add:Address>
                </b:ConsumerReference>
                <b:InitialTerminationTime>{InitialTerminationTime}</b:InitialTerminationTime>
            </b:Subscribe>
        </soap:Body>
    </soap:Envelope>
`;

const RENEW_XML_TEMPLATE = `
    <soap:Envelope xmlns:add="http://www.w3.org/2005/08/addressing" xmlns:b="http://docs.oasis-open.org/wsn/b-2" xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <add:Action>http://docs.oasis-open.org/wsn/bw-2/SubscriptionManager/RenewRequest</add:Action>
            <add:To>{To}</add:To>
            <wsse:Security soap:mustUnderstand="true" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
                <wsse:UsernameToken wsu:Id="UsernameToken-{UsernameToken}">
                    <wsse:Username>{Username}</wsse:Username>
                    <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">{PasswordDigest}</wsse:Password>
                    <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">{Nonce}</wsse:Nonce>
                    <wsu:Created>{Created}</wsu:Created>
                </wsse:UsernameToken>
            </wsse:Security>
        </soap:Header>
        <soap:Body>
            <b:Renew>
                <b:TerminationTime>{TerminationTime}</b:TerminationTime>
            </b:Renew>
        </soap:Body>
    </soap:Envelope>
`;

const UNSUBSCRIBE_XML_TEMPLATE = `
    <soap:Envelope xmlns:add="http://www.w3.org/2005/08/addressing" xmlns:b="http://docs.oasis-open.org/wsn/b-2" xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <add:Action>http://docs.oasis-open.org/wsn/bw-2/SubscriptionManager/UnsubscribeRequest</add:Action>
            <add:To>{To}</add:To>
            <wsse:Security soap:mustUnderstand="true" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
                <wsse:UsernameToken wsu:Id="UsernameToken-{UsernameToken}">
                    <wsse:Username>{Username}</wsse:Username>
                    <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">{PasswordDigest}</wsse:Password>
                    <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">{Nonce}</wsse:Nonce>
                    <wsu:Created>{Created}</wsu:Created>
                </wsse:UsernameToken>
            </wsse:Security>
        </soap:Header>
        <soap:Body>
            <b:Unsubscribe/>
        </soap:Body>
    </soap:Envelope>
`;

const PULLPOINT_XML_TEMPLATE = `
    <soap:Envelope xmlns:add="http://www.w3.org/2005/08/addressing" xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsdl="http://www.onvif.org/ver10/events/wsdl">
        <soap:Header>
            <add:Action>http://www.onvif.org/ver10/events/wsdl/EventPortType/CreatePullPointSubscriptionRequest</add:Action>
            <wsse:Security soap:mustUnderstand="true" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
                <wsse:UsernameToken wsu:Id="UsernameToken-{UsernameToken}">
                    <wsse:Username>{Username}</wsse:Username>
                    <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">{PasswordDigest}</wsse:Password>
                    <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">{Nonce}</wsse:Nonce>
                    <wsu:Created>{Created}</wsu:Created>
                </wsse:UsernameToken>
            </wsse:Security>
        </soap:Header>
        <soap:Body>
            <wsdl:CreatePullPointSubscription>
                <wsdl:InitialTerminationTime>{InitialTerminationTime}</wsdl:InitialTerminationTime>
            </wsdl:CreatePullPointSubscription>
        </soap:Body>
    </soap:Envelope>
`;

const PULLMESSAGE_XML_TEMPLATE = `
    <soap:Envelope xmlns:add="http://www.w3.org/2005/08/addressing" xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsdl="http://www.onvif.org/ver10/events/wsdl">
        <soap:Header>
            <add:Action>http://www.onvif.org/ver10/events/wsdl/PullPointSubscription/PullMessagesRequest</add:Action>
            <add:To>{To}</add:To>
            <wsse:Security soap:mustUnderstand="true" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
                <wsse:UsernameToken wsu:Id="UsernameToken-{UsernameToken}">
                    <wsse:Username>{Username}</wsse:Username>
                    <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">{PasswordDigest}</wsse:Password>
                    <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">{Nonce}</wsse:Nonce>
                    <wsu:Created>{Created}</wsu:Created>
                </wsse:UsernameToken>
            </wsse:Security>
        </soap:Header>
        <soap:Body>
            <wsdl:PullMessages>
                <wsdl:Timeout>{Timeout}</wsdl:Timeout>
                <wsdl:MessageLimit>100</wsdl:MessageLimit>
            </wsdl:PullMessages>
        </soap:Body>
    </soap:Envelope>
`;

export function buildSubscribeXml(params: TemplateParams): string {
  return renderTemplate(SUBSCRIBE_XML_TEMPLATE, params);
}

export function buildRenewXml(params: TemplateParams): string {
  return renderTemplate(RENEW_XML_TEMPLATE, params);
}

export function buildUnsubscribeXml(params: TemplateParams): string {
  return renderTemplate(UNSUBSCRIBE_XML_TEMPLATE, params);
}

export function buildPullPointXml(params: TemplateParams): string {
  return renderTemplate(PULLPOINT_XML_TEMPLATE, params);
}

export function buildPullMessageXml(params: TemplateParams): string {
  return renderTemplate(PULLMESSAGE_XML_TEMPLATE, params);
}

export type { TemplateParams };

