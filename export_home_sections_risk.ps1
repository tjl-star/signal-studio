$ErrorActionPreference = 'Stop'
$base = 'http://101.132.68.174:8123/skill'

function C([int[]]$codes) {
    -join ($codes | ForEach-Object { [char]$_ })
}

$folderName = C @(0x9996,0x9875,0x6D41,0x91CF,0x4E0E,0x8F6C,0x5316,0x6F0F,0x6597)
$outDir = Join-Path $env:USERPROFILE (Join-Path 'Desktop' $folderName)
$startDate = '2026-07-04'
$endDate = '2026-08-04'
$appId = '22'
$appName = C @(0x65B0,0x4EBA,0x4EBA,0x89C6,0x9891)
$androidLabel = C @(0x5B89,0x5353)
$mSiteLabel = 'M' + (C @(0x7AD9))
$channels = @(
    (C @(0x7CBE,0x9009)),
    (C @(0x7535,0x5F71)),
    (C @(0x7F8E,0x5267)),
    (C @(0x82F1,0x5267)),
    (C @(0x97E9,0x5267)),
    (C @(0x65E5,0x5267)),
    (C @(0x6CF0,0x5267)),
    (C @(0x56FD,0x4EA7,0x5267))
)
$riskLevels = @(
    (C @(0x4F4E,0x98CE,0x9669)),
    (C @(0x9AD8,0x98CE,0x9669)),
    (C @(0x5176,0x4ED6))
)

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Invoke-DataProvider([string]$endpoint, [hashtable]$params) {
    $query = ($params.GetEnumerator() | ForEach-Object {
        '{0}={1}' -f [Uri]::EscapeDataString([string]$_.Key), [Uri]::EscapeDataString([string]$_.Value)
    }) -join '&'
    Invoke-RestMethod -Uri "$base/$endpoint`?$query" -TimeoutSec 60
}

$clientInfo = Invoke-DataProvider 'getAllClientTypeInfo' @{}
$clientTypes = @($clientInfo | ForEach-Object { [string]$_.client_type })
$groups = [ordered]@{
    $androidLabel = @($clientTypes | Where-Object { $_ -like 'android*' } | Sort-Object)
    'iOS' = @($clientTypes | Where-Object { $_ -like 'ios_*' -or $_ -like 'ipad_*' } | Sort-Object)
    $mSiteLabel = @($clientTypes | Where-Object { $_ -in @('web_applet', 'web_pc') } | Sort-Object)
}

$rows = [System.Collections.Generic.List[object]]::new()
$queryCount = 0
foreach ($platform in $groups.Keys) {
    $clientFilter = $groups[$platform] -join '#'
    foreach ($risk in $riskLevels) {
        foreach ($channel in $channels) {
            $queryCount++
            $response = Invoke-DataProvider 'sectionData' @{
                startDate = $startDate
                endDate = $endDate
                clienttype = $clientFilter
                channel_id = $appId
                risk_level = $risk
                channel = $channel
            }
            foreach ($item in @($response)) {
                $rows.Add([pscustomobject]@{
                    date = $item.date
                    application_name = $appName
                    application_id = $appId
                    board_name = $item.channel
                    sub_board_name = $item.group_name
                    client = $platform
                    risk_level = $risk
                    exposure_pv = $item.exposure_count
                    exposure_uv = $item.exposure_user
                    click_pv = $item.click_count
                    click_uv = $item.click_user
                    click_ctr_pv = $item.ctr_pv
                    click_ctr_uv = $item.ctr_uv
                    source = 'sectionData'
                })
            }
        }
    }
}

$rows = @($rows | Sort-Object date, board_name, sub_board_name, client, risk_level)
$manifest = [ordered]@{
    source = 'data-provider /skill/sectionData'
    application_name = $appName
    application_id = $appId
    date_range = @($startDate, $endDate)
    channels = $channels
    risk_levels = $riskLevels
    client_groups = [ordered]@{
        $androidLabel = ($groups[$androidLabel] -join '#')
        iOS = ($groups['iOS'] -join '#')
        $mSiteLabel = ($groups[$mSiteLabel] -join '#')
    }
    query_count = $queryCount
    returned_row_count = $rows.Count
    field_mapping = [ordered]@{
        board_name = 'sectionData.channel'
        sub_board_name = 'sectionData.group_name'
        exposure_pv = 'sectionData.exposure_count'
        exposure_uv = 'sectionData.exposure_user'
        click_pv = 'sectionData.click_count'
        click_uv = 'sectionData.click_user'
        click_ctr_pv = 'sectionData.ctr_pv'
        click_ctr_uv = 'sectionData.ctr_uv'
    }
    note = 'Blank sub_board_name is the channel-level summary row returned by the API.'
}

@{ manifest = $manifest; rows = $rows } |
    ConvertTo-Json -Depth 10 |
    Set-Content -Encoding UTF8 (Join-Path $outDir 'home_sections_risk_detail.json')
$rows | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $outDir 'home_sections_risk_data.csv')
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $outDir 'home_sections_query_notes.txt')

$manifest | ConvertTo-Json -Depth 10
