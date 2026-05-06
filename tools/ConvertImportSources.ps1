Add-Type -AssemblyName System.IO.Compression.FileSystem
$ErrorActionPreference='Stop'
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root 'UniversityEventManagement.Api/Data/ImportSource'
$out = Join-Path $root 'UniversityEventManagement.Api/Data/Seed'
New-Item -ItemType Directory -Force $out | Out-Null
$warnings = New-Object System.Collections.Generic.List[object]
function Add-Warning($sourceName,$row,$field,$value,$message){ $warnings.Add([pscustomobject]@{Source=$sourceName; Row=$row; Field=$field; Value=($value -as [string]); Message=$message}) }
function ReadEntry($zip,$name){ $e=$zip.GetEntry($name); if(!$e){return $null}; $sr=[IO.StreamReader]::new($e.Open()); try{$sr.ReadToEnd()} finally{$sr.Dispose()} }
function Normalize-Text($value){
  if($null -eq $value){ return '' }
  $s=[string]$value
  $s=$s -replace '&amp;','&'
  $s=$s.Trim()
  $s=[Text.RegularExpressions.Regex]::Replace($s,'\s+',' ')
  return $s
}
function Normalize-Key($value){
  $s=(Normalize-Text $value).ToLowerInvariant()
  $s=$s.Replace('ı','i').Replace('ğ','g').Replace('ü','u').Replace('ş','s').Replace('ö','o').Replace('ç','c')
  $remove=@('maltepe universitesi','saglik kultur ve spor daire baskanligi','saglik, kultur ve spor daire baskanligi','sks','mau','mu','kulubu','toplulugu','ogrenci','universitesi')
  foreach($r in $remove){ $s=$s.Replace($r,' ') }
  $s=[Text.RegularExpressions.Regex]::Replace($s,'[^a-z0-9]+',' ')
  $s=[Text.RegularExpressions.Regex]::Replace($s,'\s+',' ').Trim()
  return $s
}
function Get-CellColumn($ref){ if($ref -match '^([A-Z]+)'){ $col=0; foreach($ch in $matches[1].ToCharArray()){ $col=$col*26+([int][char]$ch-[int][char]'A'+1)}; return $col-1}; return 0 }
function Get-XlsxWorkbook($path){
  $zip=[System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $path).Path)
  $shared=@()
  $ss=ReadEntry $zip 'xl/sharedStrings.xml'
  if($ss){ [xml]$sx=$ss; $n=New-Object Xml.XmlNamespaceManager($sx.NameTable); $n.AddNamespace('m','http://schemas.openxmlformats.org/spreadsheetml/2006/main'); foreach($si in $sx.SelectNodes('//m:si',$n)){ $shared += (($si.SelectNodes('.//m:t',$n) | ForEach-Object { $_.InnerText }) -join '') } }
  [xml]$wb=ReadEntry $zip 'xl/workbook.xml'; [xml]$rels=ReadEntry $zip 'xl/_rels/workbook.xml.rels'
  $ns=New-Object Xml.XmlNamespaceManager($wb.NameTable); $ns.AddNamespace('m','http://schemas.openxmlformats.org/spreadsheetml/2006/main'); $ns.AddNamespace('r','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
  $rns=New-Object Xml.XmlNamespaceManager($rels.NameTable); $rns.AddNamespace('rel','http://schemas.openxmlformats.org/package/2006/relationships')
  $sheets=@()
  foreach($sheet in $wb.SelectNodes('//m:sheet',$ns)){
    $id=$sheet.GetAttribute('id','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $rel=$rels.SelectSingleNode("//rel:Relationship[@Id='$id']",$rns)
    $target=('xl/'+$rel.Target).Replace('xl//','xl/')
    [xml]$sh=ReadEntry $zip $target
    $sns=New-Object Xml.XmlNamespaceManager($sh.NameTable); $sns.AddNamespace('m','http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $rows=@()
    foreach($row in $sh.SelectNodes('//m:sheetData/m:row',$sns)){
      $vals=@{}
      foreach($c in $row.SelectNodes('m:c',$sns)){
        $idx=Get-CellColumn $c.r
        $v=$c.SelectSingleNode('m:v',$sns); $val= if($v){$v.InnerText}else{''}
        if($c.t -eq 's' -and $val -match '^\d+$'){ $val=$shared[[int]$val] }
        $vals[$idx]=Normalize-Text $val
      }
      if($vals.Count -gt 0){ $rows += ,[pscustomobject]@{Number=[int]$row.r; Values=$vals} }
    }
    $sheets += ,[pscustomobject]@{Name=$sheet.name; Rows=$rows}
  }
  $zip.Dispose()
  return $sheets
}
function Get-RowArray($row,$count=8){ $a=@(); for($i=0;$i -lt $count;$i++){ $a += $(if($row.Values.ContainsKey($i)){$row.Values[$i]}else{''}) }; return $a }
function Parse-IntSafe($v){ $s=(Normalize-Text $v) -replace '[^0-9]',''; if($s){ return [int]$s }; return $null }
function Parse-DateSafe($v,$sourceName,$row){
  $s=Normalize-Text $v
  if(!$s){ return $null }
  if($s -match '^\d+(\.\d+)?$'){
    try { return ([DateTime]::FromOADate([double]$s)).ToString('yyyy-MM-dd') } catch { Add-Warning $sourceName $row 'Date' $v 'Excel serial date could not be parsed'; return $null }
  }
  $candidate=$s -replace '[^0-9\.]',''
  if($candidate -match '^(\d{1,2})\.(\d{1,2})\.(\d{4,5})$'){
    $day=[int]$matches[1]; $month=[int]$matches[2]; $yearText=$matches[3]
    if($yearText.Length -eq 5 -and $yearText.StartsWith('202')){ $yearText=$yearText.Substring(0,4) }
    $year=[int]$yearText
    try { return ([DateTime]::new($year,$month,$day)).ToString('yyyy-MM-dd') } catch { Add-Warning $sourceName $row 'Date' $v 'Invalid calendar date'; return $null }
  }
  Add-Warning $sourceName $row 'Date' $v 'Unknown date format'
  return $null
}
function Read-DocxTables($path){
 $zip=[System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $path).Path)
 try{ [xml]$doc=ReadEntry $zip 'word/document.xml'; $ns=New-Object Xml.XmlNamespaceManager($doc.NameTable); $ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main'); $tables=@(); foreach($tbl in $doc.SelectNodes('//w:tbl',$ns)){ $rows=@(); foreach($tr in $tbl.SelectNodes('w:tr',$ns)){ $cells=@(); foreach($tc in $tr.SelectNodes('w:tc',$ns)){ $cells += (Normalize-Text (($tc.SelectNodes('.//w:t',$ns) | ForEach-Object {$_.InnerText}) -join '')) }; if(($cells -join '').Trim()){ $rows += ,$cells } }; if($rows.Count){$tables += ,$rows} }; return $tables } finally{$zip.Dispose()}
}
function Guess-ClubName($organizer,$known){
  $key=Normalize-Key $organizer
  if(!$key){return $null}
  $best=$null; $bestScore=0
  foreach($club in $known){
    $ck=Normalize-Key $club.Name
    if(!$ck){continue}
    $score=0
    if($key -eq $ck){$score=100}
    elseif($key.Contains($ck) -or $ck.Contains($key)){$score=[Math]::Min($ck.Length,$key.Length)}
    else { foreach($part in $ck.Split(' ')){ if($part.Length -gt 3 -and $key.Contains($part)){ $score += $part.Length } } }
    if($score -gt $bestScore){$bestScore=$score; $best=$club.Name}
  }
  if($bestScore -ge 5){return $best}
  return $null
}
$foe=Get-XlsxWorkbook (Join-Path $source 'FOE DEĞERLER.xlsx')
$rooms=@()
$roomSheet=$foe | Where-Object Name -eq 'Etkinlik Salonları' | Select-Object -First 1
foreach($row in $roomSheet.Rows | Select-Object -Skip 1){ $a=Get-RowArray $row 3; if($a[0]){ $rooms += [pscustomobject]@{Name=$a[0]; Capacity=Parse-IntSafe $a[1]; Building=$null; Notes=$a[1]} } }
$clubsByKey=@{}
$clubSheet=$foe | Where-Object Name -eq 'Kulüp Bilgileri' | Select-Object -First 1
foreach($row in $clubSheet.Rows | Select-Object -Skip 1){ $a=Get-RowArray $row 5; if(!$a[0]){continue}; $name=$a[0]; $key=Normalize-Key $name; if(!$clubsByKey.ContainsKey($key)){ $clubsByKey[$key]=[pscustomobject]@{Name=$name; Description=$a[3]; InstagramUrl=$a[2]; DeclaredMemberCount=Parse-IntSafe $a[1]; ActualMemberCount=$null; AcademicYear='2025-2026'; Category='Kulüp'; LogoUrl=$null; IsActive=$true} } }
$statsRows=Get-XlsxWorkbook (Join-Path $source 'Kulüpler-2425-2526.xlsx') | Select-Object -First 1
$statGroups=@{}
foreach($row in $statsRows.Rows | Select-Object -Skip 1){
  $a=Get-RowArray $row 6
  if(!$a[0] -or !$a[1]){continue}
  $club=$a[0]
  $ck=Normalize-Key $club
  if(!$clubsByKey.ContainsKey($ck)){ continue }
  $year=$a[1]
  $key=$ck+'|'+$year
  if(!$statGroups.ContainsKey($key)){
    $statGroups[$key]=[pscustomobject]@{ClubName=$clubsByKey[$ck].Name; AcademicYear=$year; TotalMembers=0; Faculty=@{}; Department=@{}}
  }
  $g=$statGroups[$key]
  $g.TotalMembers++
  $fac=if($a[4]){$a[4]}else{'Belirtilmemiş'}
  $dep=if($a[5]){$a[5]}else{'Belirtilmemiş'}
  $g.Faculty[$fac]=1+$(if($g.Faculty.ContainsKey($fac)){$g.Faculty[$fac]}else{0})
  $g.Department[$dep]=1+$(if($g.Department.ContainsKey($dep)){$g.Department[$dep]}else{0})
}
$clubStats=@(); foreach($g in $statGroups.Values){ $clubStats += [pscustomobject]@{ClubName=$g.ClubName; AcademicYear=$g.AcademicYear; TotalMembers=$g.TotalMembers; FacultyDistribution=$g.Faculty; DepartmentDistribution=$g.Department} }
foreach($club in $clubsByKey.Values){ $latest=$clubStats | Where-Object { (Normalize-Key $_.ClubName) -eq (Normalize-Key $club.Name) } | Sort-Object AcademicYear -Descending | Select-Object -First 1; if($latest){ $club.ActualMemberCount=$latest.TotalMembers; $club.AcademicYear=$latest.AcademicYear } }
$events=@()
foreach($sheet in $foe | Where-Object { $_.Name -notin @('Etkinlik Salonları','Kulüp Bilgileri','Planlanan EtkinliklerGelecek') }){
  foreach($row in $sheet.Rows | Select-Object -Skip 1){ $a=Get-RowArray $row 4; if(!$a[0] -or $a[0] -match 'Et?trkinlik Adı'){continue}; $org=$a[2]; $club=Guess-ClubName $org $clubsByKey.Values; $events += [pscustomobject]@{Title=$a[0]; Date=Parse-DateSafe $a[1] $sheet.Name $row.Number; OrganizerText=$org; ClubName=$club; RoomName=$null; LocationText=$null; ParticipantCount=$null; Capacity=Parse-IntSafe $a[3]; SourceYear=2026; IsPastEvent=$false; Description=$null; Source='FOE'} }
}
foreach($doc in @(@{Path='2024 Sosyal, Kültürel, Sportif Faaliyetler.docx';Year=2024},@{Path='2025 KIDR SKS.docx';Year=2025})){
  $tables=Read-DocxTables (Join-Path $source $doc.Path); $rows=$tables[0]
  $start=0; if($rows[0][0] -match 'Sıra|Sira'){$start=1}
  for($i=$start;$i -lt $rows.Count;$i++){
    $r=$rows[$i]; if($r.Count -lt 5){continue}
    if($doc.Year -eq 2025){ $date=$r[1]; $title=$r[2]; $org=$r[3]; $part=$r[4] } else { $title=$r[1]; $date=$r[2]; $org=$r[3]; $part=$r[4] }
    $loc=$null; if($title -match 'Yer:\s*([^\r\n]+)'){ $loc=$matches[1] }
    $cleanTitle=(Normalize-Text ($title -replace 'Yer:.*$',''))
    if(!$cleanTitle){continue}
    $club=Guess-ClubName $org $clubsByKey.Values
    $events += [pscustomobject]@{Title=$cleanTitle; Date=Parse-DateSafe $date $doc.Path ($i+1); OrganizerText=$org; ClubName=$club; RoomName=$null; LocationText=$loc; ParticipantCount=Parse-IntSafe $part; Capacity=$null; SourceYear=$doc.Year; IsPastEvent=$true; Description=$null; Source=$doc.Path}
  }
}
$clubs=$clubsByKey.Values | Sort-Object Name
$rooms | Sort-Object Name | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 (Join-Path $out 'seed-rooms.json')
$clubs | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 (Join-Path $out 'seed-clubs.json')
$events | Sort-Object SourceYear, Date, Title | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 (Join-Path $out 'seed-events.json')
$clubStats | Sort-Object ClubName, AcademicYear | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 (Join-Path $out 'seed-club-statistics.json')
$warnings | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 (Join-Path $out 'import-warnings.json')
[pscustomobject]@{Rooms=$rooms.Count; Clubs=$clubs.Count; Events=$events.Count; ClubStatistics=$clubStats.Count; Warnings=$warnings.Count} | ConvertTo-Json
